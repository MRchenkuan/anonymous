const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  p2p: {
    init: () => ipcRenderer.invoke('p2p:init'),
    createPost: (content) => ipcRenderer.invoke('p2p:createPost', content),
    getPosts: () => ipcRenderer.invoke('p2p:getPosts'),
    createComment: (postId, content) => ipcRenderer.invoke('p2p:createComment', postId, content),
    getComments: (postId) => ipcRenderer.invoke('p2p:getComments', postId),
    setNickname: (nickname) => ipcRenderer.invoke('p2p:setNickname', nickname),
    getNickname: (address) => ipcRenderer.invoke('p2p:getNickname', address),
    onPeerConnected: (callback) => ipcRenderer.on('peer:connected', (_, count) => callback(count)),
    onPostReceived: (callback) => ipcRenderer.on('post:received', (_, post) => callback(post)),
    onCommentReceived: (callback) => ipcRenderer.on('comment:received', (_, comment) => callback(comment)),
    onNicknameUpdated: (callback) => ipcRenderer.on('nickname:updated', (_, data) => callback(data))
  }
})