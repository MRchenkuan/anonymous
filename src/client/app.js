export class Client {
  constructor() {
    this.identity = null
  }

  async init() {
    this.identity = { address: await window.api.p2p.init() }
  }

  async createPost(content) {
    return await window.api.p2p.createPost(content)
  }

  async getPosts() {
    return await window.api.p2p.getPosts()
  }

  async createComment(postId, content) {
    return await window.api.p2p.createComment(postId, content)
  }

  async getComments(postId) {
    return await window.api.p2p.getComments(postId)
  }

  on(event, callback) {
    switch(event) {
      case 'peer_connected':
        window.api.p2p.onPeerConnected(callback)
        break
      case 'post_received':
        window.api.p2p.onPostReceived(callback)
        break
      case 'comment_received':
        window.api.p2p.onCommentReceived(callback)
        break
      case 'nickname_updated':
        window.api.p2p.onNicknameUpdated(callback)
        break
    }
  }

  async setNickname(nickname) {
    return await window.api.p2p.setNickname(nickname)
  }

  async getNickname(address) {
    return await window.api.p2p.getNickname(address)
  }
}