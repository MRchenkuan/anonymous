import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@libp2p/noise'
import { mplex } from '@libp2p/mplex'
import { Identity } from '../core/crypto.js'
import { EventEmitter } from 'events'

export class P2PNetwork {
  constructor(identity) {
    this.peers = new Set()
    this.messageHandlers = new Map()
    this.identity = identity
    this.emitter = new EventEmitter()
  }

  async init() {
    this.node = await createLibp2p({
      addresses: {
        // 修改监听地址，允许所有网络接口
        listen: ['/ip4/0.0.0.0/tcp/0']
      },
      transports: [tcp()],
      streamMuxers: [mplex()],
      connectionEncryption: [noise()]
    })

    // 修改事件监听方式
    this.node.addEventListener('peer:connect', (evt) => {
      const peerId = evt.detail.toString()
      this.peers.add(peerId)
      console.log('节点已连接:', peerId)
    })

    this.node.addEventListener('peer:disconnect', (evt) => {
      const peerId = evt.detail.toString()
      this.peers.delete(peerId)
      console.log('节点已断开:', peerId)
    })

    // 添加协议处理
    await this.node.handle('/anonymous-forum/1.0.0', async ({ stream }) => {
      const message = await this.readMessage(stream)
      const handler = this.messageHandlers.get(message.type)
      if (handler) {
        await handler(message.data)
      }
    })

    await this.node.start()
    console.log('P2P 网络已启动，监听地址:', this.node.getMultiaddrs())
  }

  async broadcast(type, data) {
    const message = {
      type,
      data,
      signature: this.identity.sign(JSON.stringify(data)),
      publicKey: this.identity.getPublicKey()
    }

    for (const peerId of this.peers) {
      try {
        // 直接使用 peerId 字符串
        const stream = await this.node.dialProtocol(peerId, '/anonymous-forum/1.0.0')
        await stream.sink([Buffer.from(JSON.stringify(message))])
      } catch (err) {
        console.error(`广播消息到节点 ${peerId} 失败:`, err)
        this.peers.delete(peerId)
      }
    }
  }

  async readMessage(stream) {
    const chunks = []
    for await (const chunk of stream.source) {
      chunks.push(chunk)
    }
    return JSON.parse(Buffer.concat(chunks).toString())
  }

  onMessage(type, handler) {
    this.messageHandlers.set(type, handler)
  }

  // 添加新的协议处理器
async setupSyncHandler() {
  await this.node.handle('/sync/request', async ({ stream }) => {
    const { sink, source } = stream
    const writer = sink.getWriter()
    
    try {
      // 获取所有本地数据
      const data = await this.getAllData()
      await writer.write(encoder.encode(JSON.stringify(data)))
    } finally {
      await writer.close()
    }
  })

  // 连接到新节点时请求数据同步
  this.node.connectionManager.addEventListener('peer:connect', async (evt) => {
    try {
      const stream = await this.node.dialProtocol(evt.detail.remotePeer, '/sync/request')
      const chunks = []
      for await (const chunk of stream.source) {
        chunks.push(chunk)
      }
      const data = JSON.parse(Buffer.concat(chunks).toString())
      await this.syncData(data)
    } catch (err) {
      console.error('数据同步失败:', err)
    }
  })
}

async getAllData() {
  return {
    posts: await db.getAllPosts(),
    nicknames: await db.getAllNicknames()
  }
}

async syncData(data) {
  // 同步帖子
  for (const post of data.posts) {
    if (await this.verifyData(post)) {
      await db.savePost(post)
    }
  }
  
  // 同步昵称
  for (const nickname of data.nicknames) {
    if (await this.verifyData(nickname)) {
      await db.saveNickname(nickname)
    }
  }
}

async verifyData(data) {
  try {
    return this.identity.verify(
      data.content || data.nickname,
      data.signature,
      data.publicKey
    )
  } catch (err) {
    console.error('数据验证失败:', err)
    return false
  }
}
}