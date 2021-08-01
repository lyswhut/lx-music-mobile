import { createCipheriv, createDecipheriv } from 'crypto'
import BackgroundTimer from 'react-native-background-timer'

export const request = (url, { timeout = 10000, ...options } = {}) => {
  const controller = new global.AbortController()
  const id = BackgroundTimer.setTimeout(() => controller.abort(), timeout)
  return global.fetch(url, {
    ...options,
    signal: controller.signal,
  }).then(response => {
    BackgroundTimer.clearTimeout(id)
    return response.text()
  }).catch(err => {
    // console.log(err, err.code, err.message)
    return Promise.reject(err)
  })
}

export const aesEncrypt = (text, key, iv) => {
  const cipher = createCipheriv('aes-128-cbc', Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'))
  return Buffer.concat([cipher.update(Buffer.from(text)), cipher.final()]).toString('base64')
}

export const aesDecrypt = (text, key, iv) => {
  const decipher = createDecipheriv('aes-128-cbc', Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(text, 'base64')), decipher.final()]).toString()
}

export const encryptMsg = msg => {
  return msg
  // const keyInfo = global.syncKeyInfo
  // if (!keyInfo) return ''
  // return aesEncrypt(msg, keyInfo.key, keyInfo.iv)
}

export const decryptMsg = enMsg => {
  return enMsg
  // const keyInfo = global.syncKeyInfo
  // if (!keyInfo) return ''
  // let msg = ''
  // try {
  //   msg = aesDecrypt(enMsg, keyInfo.key, keyInfo.iv)
  // } catch (err) {
  //   console.log(err)
  // }
  // return msg
}
