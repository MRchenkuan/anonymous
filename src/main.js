import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'url'
import fs from 'fs'
import path from 'path'
import { P2PNetwork } from './network/p2p.js'
import { Identity } from './core/crypto.js'
import { Database } from './storage/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))


// 初始化身份
function initIdentity() {
  const keyPath = path.join(app.getPath('userData'), 'keys.json')
  let savedKeys = null
  
  try {
    if (fs.existsSync(keyPath)) {
      savedKeys = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
    }
    const identity = new Identity(savedKeys)
    if (!savedKeys) {
      fs.writeFileSync(keyPath, JSON.stringify(identity.toJSON()))
    }
    return identity
  } catch (err) {
    console.error('Failed to load or save keys:', err)
    throw err
  }
}

const identity = initIdentity()
const db = new Database()
const p2p = new P2PNetwork(identity)
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false
    }
  })

  // 添加页面加载错误处理
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('页面加载失败:', errorDescription)
  })

  mainWindow.loadFile(path.join(__dirname, 'client/index.html'))
  mainWindow.webContents.openDevTools()

  // 添加控制台错误监听
  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log('渲染进程日志:', message)
  })

  // 修改 P2P 事件处理
  if (p2p.emitter) {
    p2p.emitter.on('peer_connected', (count) => {
      if (mainWindow) {
        mainWindow.webContents.send('peer:connected', count)
      }
    })

    p2p.emitter.on('post_received', (post) => {
      if (mainWindow) {
        mainWindow.webContents.send('post:received', post)
      }
    })

    p2p.emitter.on('comment_received', (comment) => {
      if (mainWindow) {
        mainWindow.webContents.send('comment:received', comment)
      }
    })
  } else {
    console.warn('P2P emitter not initialized')
  }
}

// IPC handlers
ipcMain.handle('p2p:init', async () => {
  await p2p.init()
  return identity.address
})

ipcMain.handle('p2p:createPost', async (event, content) => {
  const post = {
    content,
    author: identity.address,
    signature: identity.sign(content),
    publicKey: identity.getPublicKey(),
    timestamp: Date.now()
  }
  const id = await db.savePost(post)
  await p2p.broadcast('new_post', { id, ...post })
  return { id, ...post }
})

ipcMain.handle('p2p:getPosts', async () => {
  return await db.getAllPosts()
})

ipcMain.handle('p2p:createComment', async (event, postId, content) => {
  const comment = {
    content,
    author: identity.address,
    signature: identity.sign(content),
    publicKey: identity.getPublicKey(),
    timestamp: Date.now()
  }
  const id = await db.saveComment(postId, comment)
  await p2p.broadcast('new_comment', { id, postId, ...comment })
  return { id, ...comment }
})

ipcMain.handle('p2p:getComments', async (event, postId) => {
  return await db.getPostComments(postId)
})

ipcMain.handle('p2p:setNickname', async (event, nickname) => {
  const data = {
    nickname,
    author: identity.address,
    signature: identity.sign(nickname),
    publicKey: identity.getPublicKey(),
    timestamp: Date.now()
  }
  await db.saveNickname(data)
  await p2p.broadcast('nickname_updated', data)
  return data
})

ipcMain.handle('p2p:getNickname', async (event, address) => {
  return await db.getNickname(address)
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})