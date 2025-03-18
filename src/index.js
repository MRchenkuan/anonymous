import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { P2PNetwork } from './network/p2p.js'
import { Database } from './storage/db.js'
import { Identity } from './core/crypto.js'
import { networkInterfaces } from 'os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const identity = new Identity()
const db = new Database()
const p2p = new P2PNetwork(identity)

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// 获取身份信息
app.get('/api/identity', (req, res) => {
  res.json({
    address: identity.address,
    publicKey: identity.getPublicKey()
  })
})

// 发布新帖子
app.post('/api/posts', async (req, res) => {
  try {
    const { content } = req.body
    const signature = identity.sign(content)
    
    const post = {
      content,
      author: identity.address,
      signature,
      publicKey: identity.getPublicKey(),
      timestamp: Date.now()
    }

    const id = await db.savePost(post)
    await p2p.broadcast('new_post', { id, ...post })
    
    res.json({ id, ...post })
  } catch (error) {
    console.error('发布帖子失败:', error)
    res.status(500).json({ error: '发布帖子失败' })
  }
})

// 获取所有帖子
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await db.getAllPosts()
    res.json(posts)
  } catch (error) {
    console.error('获取帖子失败:', error)
    res.status(500).json({ error: '获取帖子失败' })
  }
})

// 发表评论
app.post('/api/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params
    const { content } = req.body
    const signature = identity.sign(content)

    const comment = {
      content,
      author: identity.address,
      signature,
      publicKey: identity.getPublicKey(),
      timestamp: Date.now()
    }

    const id = await db.saveComment(postId, comment)
    await p2p.broadcast('new_comment', { id, postId, ...comment })

    res.json({ id, ...comment })
  } catch (error) {
    console.error('发表评论失败:', error)
    res.status(500).json({ error: '发表评论失败' })
  }
})

// 获取帖子评论
app.get('/api/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params
    const comments = await db.getPostComments(postId)
    res.json(comments)
  } catch (error) {
    console.error('获取评论失败:', error)
    res.status(500).json({ error: '获取评论失败' })
  }
})

// 获取本机IP地址
function getLocalIP() {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return '0.0.0.0'
}

const PORT = process.env.PORT || 3000  // 修改端口号
// const HOST = getLocalIP()  // 注释掉这行

// 修改监听配置，使用 '0.0.0.0' 允许所有 IP 访问
app.listen(PORT, '0.0.0.0', async () => {
  await p2p.init()
  const localIP = getLocalIP()
  console.log(`服务器运行在:`)
  console.log(`- 本地访问: http://localhost:${PORT}`)
  console.log(`- 局域网访问: http://${localIP}:${PORT}`)
})