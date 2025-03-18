import { Client } from './app.js'

const client = new Client()

async function init() {
  await client.init()
  
  // 监听新帖子
  client.on('post_received', (post) => {
    console.log('收到新帖子:', post)
    refreshPosts()
  })

  // 监听新评论
  client.on('comment_received', (comment) => {
    console.log('收到新评论:', comment)
    refreshComments(comment.postId)
  })

  // 加载初始数据
  await refreshPosts()
}

async function refreshPosts() {
  const posts = await client.getPosts()
  // 更新界面显示
}

async function refreshComments(postId) {
  const comments = await client.getComments(postId)
  // 更新界面显示
}

// 发帖
async function createPost(content) {
  const post = await client.createPost(content)
  await refreshPosts()
}

// 评论
async function createComment(postId, content) {
  const comment = await client.createComment(postId, content)
  await refreshComments(postId)
}

init()