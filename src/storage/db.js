const levelPromise = import('level')
  .then(module => module.Level || module.default)

import { Identity } from '../core/crypto.js'

export class Database {
  constructor() {
    this.init()
  }

  async init() {
    const Level = await levelPromise
    this.db = new Level('./data', { valueEncoding: 'json' })
    this.posts = this.db.sublevel('posts', { valueEncoding: 'json' })
    this.comments = this.db.sublevel('comments', { valueEncoding: 'json' })
    this.nicknames = this.db.sublevel('nicknames', { valueEncoding: 'json' })
    
    this.identity = new Identity()
    
    // 绑定所有方法
    this.getNickname = this.getNickname.bind(this)
    this.saveNickname = this.saveNickname.bind(this)
    this.getAllNicknames = this.getAllNicknames.bind(this)
    this.getAllPosts = this.getAllPosts.bind(this)
    this.getPostComments = this.getPostComments.bind(this)
  }

  async getAllPosts() {
    const posts = []
    try {
      for await (const [id, postStr] of this.posts.iterator()) {
        const post = JSON.parse(postStr)
        const comments = await this.getPostComments(post.id)
        posts.push({ ...post, comments })
      }
      return posts.sort((a, b) => b.timestamp - a.timestamp)
    } catch (err) {
      console.error('获取帖子失败:', err)
      return []
    }
  }

  async getPostComments(postId) {
    const comments = []
    try {
      for await (const [id, commentStr] of this.comments.iterator()) {
        const comment = JSON.parse(commentStr)
        if (comment.postId === postId) {
          comments.push(comment)
        }
      }
      return comments.sort((a, b) => a.timestamp - b.timestamp)
    } catch (err) {
      console.error('获取评论失败:', err)
      return []
    }
  }

  async saveNickname(data) {
    const key = `nickname:${data.author}`
    try {
      const nicknameData = {
        ...data,
        version: await this.getDataVersion('nickname', data.author),
        timestamp: Date.now()
      }

      await this.nicknames.put(key, JSON.stringify(nicknameData))
      return nicknameData
    } catch (err) {
      console.error('保存昵称失败:', err)
      throw err
    }
  }

  async getNickname(address) {
    try {
      const data = await this.nicknames.get(`nickname:${address}`)
      return JSON.parse(data)
    } catch (err) {
      if (err.notFound) {
        return null
      }
      console.error('获取昵称失败:', err)
      throw err
    }
  }

  async getAllNicknames() {
    const nicknames = []
    try {
      for await (const [key, value] of this.nicknames.iterator()) {
        nicknames.push(JSON.parse(value))
      }
      return nicknames
    } catch (err) {
      console.error('获取所有昵称失败:', err)
      return []
    }
  }

  async getDataVersion(type, id) {
    try {
      let data
      switch (type) {
        case 'post':
          data = await this.posts.get(id)
          break
        case 'comment':
          data = await this.comments.get(id)
          break
        case 'nickname':
          data = await this.nicknames.get(`nickname:${id}`)
          break
      }
      return (JSON.parse(data).version || 0) + 1
    } catch {
      return 1
    }
  }

  verifySignature(data) {
    try {
      if (!data.signature || !data.publicKey) {
        console.error('缺少签名或公钥')
        return false
      }

      const content = data.content || data.nickname || data.text
      if (!content) {
        console.error('缺少待验证内容')
        return false
      }

      return this.identity.verify(content, data.signature, data.publicKey)
    } catch (err) {
      console.error('签名验证失败:', err)
      return false
    }
  }
}