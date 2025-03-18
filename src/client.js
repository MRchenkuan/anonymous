import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 8080

const server = createServer(async (req, res) => {
  try {
    const filePath = req.url === '/' ? '/client/index.html' : `/client${req.url}`
    const content = await readFile(path.join(__dirname, filePath))
    
    const ext = path.extname(filePath)
    const contentType = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css'
    }[ext] || 'text/plain'
    
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(content)
  } catch (err) {
    res.writeHead(404)
    res.end('Not found')
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`客户端运行在: http://localhost:${PORT}`)
})