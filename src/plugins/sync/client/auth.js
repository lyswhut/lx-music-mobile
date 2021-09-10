import { getSyncAuthKey, setSyncAuthKey } from '@/utils/tools'
import { request, aesEncrypt, aesDecrypt } from './utils'
import { getDeviceName } from '@/utils/utils'
import { SYNC_CODE } from './config'
import { log } from '@/utils/log'


const hello = (host, port) => request(`http://${host}:${port}/hello`)
  .then(text => text == SYNC_CODE.helloMsg)
  .catch(err => {
    console.log(err)
    return false
  })

const getServerId = (host, port) => request(`http://${host}:${port}/id`)
  .then(text => {
    if (!text.startsWith(SYNC_CODE.idPrefix)) return ''
    return text.replace(SYNC_CODE.idPrefix, '')
  })
  .catch(err => {
    console.log(err)
    return false
  })

const codeAuth = async(host, port, serverId, authCode) => {
  let key = ''.padStart(16, Buffer.from(authCode).toString('hex'))
  const iv = Buffer.from(key.split('').reverse().join('')).toString('base64')
  key = Buffer.from(key).toString('base64')
  const msg = aesEncrypt(SYNC_CODE.authMsg + await getDeviceName(), key, iv)
  return request(`http://${host}:${port}/ah`, { headers: { m: msg } }).then(text => {
    // console.log(text)
    let msg
    try {
      msg = aesDecrypt(text, key, iv)
    } catch (err) {
      log.warn(err.stack)
      throw new Error(SYNC_CODE.authFailed)
    }
    if (!msg) return Promise.reject(new Error(SYNC_CODE.authFailed))
    const info = JSON.parse(msg)
    setSyncAuthKey(serverId, info)
    return info
  })
}

const keyAuth = async(host, port, keyInfo) => {
  const msg = aesEncrypt(SYNC_CODE.authMsg + await getDeviceName(), keyInfo.key, keyInfo.iv)
  return request(`http://${host}:${port}/ah`, { headers: { i: keyInfo.clientId, m: msg } }).then(text => {
    let msg
    try {
      msg = aesDecrypt(text, keyInfo.key, keyInfo.iv)
    } catch (err) {
      log.warn(err.stack)
      throw new Error(SYNC_CODE.authFailed)
    }
    if (msg != SYNC_CODE.helloMsg) return Promise.reject(new Error(SYNC_CODE.authFailed))
  })
}

const auth = async(host, port, serverId, authCode) => {
  if (authCode) return codeAuth(host, port, serverId, authCode)
  const keyInfo = await getSyncAuthKey(serverId)
  if (!keyInfo) throw new Error(SYNC_CODE.missingAuthCode)
  await keyAuth(host, port, keyInfo)
  return keyInfo
}

export default async(host, port, authCode) => {
  console.log('connect: ', host, port, authCode)
  if (!await hello(host, port)) throw new Error(SYNC_CODE.connectServiceFailed)
  const serverId = await getServerId(host, port)
  if (!serverId) throw new Error(SYNC_CODE.getServiceIdFailed)
  return auth(host, port, serverId, authCode)
}
