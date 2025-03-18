import { Level } from 'level'

export class Database {
  constructor() {
    this.db = new Level('./data', { valueEncoding: 'json' })
    this.posts = this.db.sublevel('posts', { valueEncoding: 'json' })
    this.comments = this.db.sublevel('comments', { valueEncoding: 'json' })
  }

  async savePost(post) {
    const id = `post_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const postData = {
      ...post,
      id,
      comments: [],
      verified: true
    }
    await this.posts.put(id, JSON.stringify(postData))
    return id
  }

  async getAllPosts() {
    const posts = []
    try {
      for await (const [id, postStr] of this.posts.iterator()) {
        const post = JSON.parse(postStr)
        const comments = await this.getPostComments(id)
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

  async saveComment(postId, comment) {
    const id = `comment_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const commentData = {
      ...comment,
      id,
      postId,
      verified: true
    }
    
    try {
      await this.comments.put(id, JSON.stringify(commentData))
      
      const postStr = await this.posts.get(postId)
      const post = JSON.parse(postStr)
      post.comments.push(id)
      await this.posts.put(postId, JSON.stringify(post))
      
      return id
    } catch (err) {
      console.error('保存评论失败:', err)
      throw err
    }
  }
}