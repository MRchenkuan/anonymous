import { Client } from './app.js'

export class UIController {
  constructor() {
    this.client = new Client()
    this.userAddress = ''
    
    // 绑定所有需要的方法到实例
    this.refreshPosts = this.refreshPosts.bind(this)
    this.createPost = this.createPost.bind(this)
    this.createComment = this.createComment.bind(this)
    this.saveNickname = this.saveNickname.bind(this)
    
    this.init()
    this.bindEvents()
  }

  async refreshPosts() {
    try {
      const posts = await this.client.getPosts()
      const postsContainer = document.getElementById('posts')
      postsContainer.innerHTML = ''
      
      for (const post of posts) {
        const postElement = await this.createPostElement(post)
        postsContainer.appendChild(postElement)
      }
    } catch (err) {
      console.error('刷新帖子失败:', err)
    }
  }

  bindEvents() {
    document.getElementById('postButton').addEventListener('click', this.createPost)
    document.getElementById('saveNickname').addEventListener('click', this.saveNickname)
    
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('comment-btn')) {
        const postId = e.target.dataset.postId
        this.createComment(postId, e.target)
      }
    })
  }

  async init() {
    try {
      console.log('Initializing client...')
      await this.client.init()
      console.log('Client initialized')
      
      this.userAddress = this.client.identity.address
      document.getElementById('userAddress').textContent = this.userAddress

      this.client.on('peer_connected', (count) => {
        console.log('Peers connected:', count)
        document.getElementById('peerCount').textContent = count
      })

      this.client.on('post_received', (post) => {
        console.log('New post received:', post)
        this.refreshPosts()
      })

      this.client.on('comment_received', (comment) => {
        console.log('New comment received:', comment)
        this.refreshComments(comment.postId)
      })

      this.client.on('nickname_updated', (data) => {
        console.log('Nickname updated:', data)
        this.refreshPosts()
      })

      await this.loadNickname()
      await this.refreshPosts()
    } catch (err) {
      console.error('Initialization failed:', err)
      alert('初始化失败: ' + err.message)
    }
  }

  async loadNickname() {
    const nickname = await this.client.getNickname(this.userAddress)
    if (nickname) {
      document.getElementById('nickname').value = nickname.nickname
    }
  }

  async saveNickname() {
    const nickname = document.getElementById('nickname').value.trim()
    if (nickname) {
      await this.client.setNickname(nickname)
      alert('昵称已保存并广播到网络')
    }
  }

  async getAuthorNickname(address) {
    const data = await this.client.getNickname(address)
    return data ? `${data.nickname} (${address})` : address
  }

  async createPostElement(post) {
    const div = document.createElement('div')
    div.className = 'p-4 bg-white rounded shadow'
    const authorName = await this.getAuthorNickname(post.author)
    div.innerHTML = `
      <p class="text-gray-600">作者: ${authorName}</p>
      <p class="mt-2">${post.content}</p>
      <p class="text-sm text-gray-500 mt-2">${new Date(post.timestamp).toLocaleString()}</p>
      <div class="mt-4">
        <input type="text" placeholder="写评论..." class="p-2 border rounded w-full" />
        <button data-post-id="${post.id}" class="comment-btn mt-2 px-4 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">评论</button>
      </div>
      <div class="comments mt-4"></div>
    `
    await this.loadComments(post.id, div.querySelector('.comments'))
    return div
  }

  async loadComments(postId, container) {
    const comments = await this.client.getComments(postId)
    const commentElements = await Promise.all(comments.map(async comment => {
      const authorName = await this.getAuthorNickname(comment.author)
      return `
        <div class="ml-4 mt-2 p-2 bg-gray-50 rounded">
          <p class="text-gray-600">作者: ${authorName}</p>
          <p class="mt-1">${comment.content}</p>
          <p class="text-xs text-gray-500">${new Date(comment.timestamp).toLocaleString()}</p>
        </div>
      `
    }))
    container.innerHTML = commentElements.join('')
  }

  async createPost() {
    try {
      const content = document.getElementById('postContent').value
      if (!content) return
      
      console.log('Creating post:', content)
      await this.client.createPost(content)
      console.log('Post created successfully')
      
      document.getElementById('postContent').value = ''
      await this.refreshPosts()
    } catch (err) {
      console.error('发布失败:', err)
      alert('发布失败: ' + err.message)
    }
  }

  async createComment(postId, button) {
    console.log(postId, button)
    const input = button.previousElementSibling
    const content = input.value
    if (!content) return

    await this.client.createComment(postId, content)
    input.value = ''
    const commentsContainer = button.parentElement.nextElementSibling
    await this.loadComments(postId, commentsContainer)
  }
}