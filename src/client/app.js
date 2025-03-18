import { P2PNetwork } from '../network/p2p.js'
import { Identity } from '../core/crypto.js'
import { Database } from '../storage/db.js'

export class Client {
  constructor() {
    this.identity = new Identity()
    this.db = new Database()
    this.p2p = new P2PNetwork(this.identity)
    this.messageHandlers = new Map()
  }

  async init() {
    await this.p2p.init()
    
    this.p2p.onMessage('new_post', async (data) => {
      await this.db.savePost(data)
      this.emit('post_received', data)
    })

    this.p2p.onMessage('new_comment', async (data) => {
      await this.db.saveComment(data.postId, data)
      this.emit('comment_received', data)
    })

    this.p2p.node.connectionManager.addEventListener('peer:connect', () => {
      const count = this.p2p.peers.size
      this.emit('peer_connected', count)
    })
  }

  async createPost(content) {
    const post = {
      content,
      author: this.identity.address,
      signature: this.identity.sign(content),
      publicKey: this.identity.getPublicKey(),
      timestamp: Date.now()
    }
    
    const id = await this.db.savePost(post)
    await this.p2p.broadcast('new_post', { id, ...post })
    return { id, ...post }
  }

  async createComment(postId, content) {
    const comment = {
      content,
      author: this.identity.address,
      signature: this.identity.sign(content),
      publicKey: this.identity.getPublicKey(),
      timestamp: Date.now()
    }

    const id = await this.db.saveComment(postId, comment)
    await this.p2p.broadcast('new_comment', { id, postId, ...comment })
    return { id, ...comment }
  }

  async getPosts() {
    return await this.db.getAllPosts()
  }

  async getComments(postId) {
    return await this.db.getPostComments(postId)
  }

  on(event, handler) {
    this.messageHandlers.set(event, handler)
  }

  emit(event, data) {
    const handler = this.messageHandlers.get(event)
    if (handler) {
      handler(data)
    }
  }
}