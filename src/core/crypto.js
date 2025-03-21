import nacl from 'tweetnacl'
import pkg from 'tweetnacl-util'
const { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } = pkg

export class Identity {
  constructor(savedKeys = null) {
    if (savedKeys) {
      this.publicKey = new Uint8Array(Object.values(savedKeys.publicKey))
      this.secretKey = new Uint8Array(Object.values(savedKeys.secretKey))
    } else {
      const keyPair = nacl.sign.keyPair()
      this.publicKey = keyPair.publicKey
      this.secretKey = keyPair.secretKey
    }
    this.address = this.generateAddress(this.publicKey)
  }

  toJSON() {
    return {
      publicKey: Array.from(this.publicKey),
      secretKey: Array.from(this.secretKey)
    }
  }

  generateAddress(publicKey) {
    const hash = nacl.hash(publicKey)
    return `0x${Buffer.from(hash).toString('hex').slice(0, 40)}`
  }

  sign(message) {
    const messageUint8 = decodeUTF8(message)
    const signature = nacl.sign.detached(messageUint8, this.secretKey)
    return encodeBase64(signature)
  }

  verify(message, signature, publicKey) {
    const messageUint8 = decodeUTF8(message)
    const signatureUint8 = decodeBase64(signature)
    return nacl.sign.detached.verify(messageUint8, signatureUint8, publicKey)
  }

  getPublicKey() {
    return encodeBase64(this.publicKey)
  }
}