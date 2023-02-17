import { getSyncAuthKey, setSyncAuthKey } from '@/utils/data'
import { request, aesEncrypt, aesDecrypt, generateRsaKey, rsaDecrypt } from './utils'
import { getDeviceName } from '@/utils/nativeModules/utils'
import { SYNC_CODE } from './config'
import log from '../log'


const hello = async(host: string, port: string) => request(`http://${host}:${port}/hello`)
  .then(({ text }) => text == SYNC_CODE.helloMsg)
  .catch((err: any) => {
    log.error('[auth] hello', err.message)
    console.log(err)
    return false
  })

const getServerId = async(host: string, port: string) => request(`http://${host}:${port}/id`)
  .then(({ text }) => {
    if (!text.startsWith(SYNC_CODE.idPrefix)) return ''
    return text.replace(SYNC_CODE.idPrefix, '')
  })
  .catch((err: any) => {
    log.error('[auth] getServerId', err.message)
    console.log(err)
    throw err
  })

const codeAuth = async(host: string, port: string, serverId: string, authCode: string) => {
  let key = ''.padStart(16, Buffer.from(authCode).toString('hex'))
  // const iv = Buffer.from(key.split('').reverse().join('')).toString('base64')
  key = Buffer.from(key).toString('base64')
  let { publicKey, privateKey } = await generateRsaKey()
  publicKey = publicKey.replace(/\n/g, '')
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
  const msg = aesEncrypt(`${SYNC_CODE.authMsg}\n${publicKey}\n${await getDeviceName()}`, key)
  // console.log(msg, key)
  return request(`http://${host}:${port}/ah`, { headers: { m: msg } }).then(async({ text, code }) => {
    // console.log(text)
    switch (text) {
      case SYNC_CODE.msgBlockedIp:
        throw new Error(SYNC_CODE.msgBlockedIp)
      case SYNC_CODE.authFailed:
        throw new Error(SYNC_CODE.authFailed)
      default:
        if (code != 200) throw new Error(SYNC_CODE.authFailed)
    }
    let msg
    try {
      msg = rsaDecrypt(Buffer.from(text, 'base64'), privateKey).toString()
    } catch (err: any) {
      log.error('[auth] codeAuth decryptMsg error', err.message)
      throw new Error(SYNC_CODE.authFailed)
    }
    // console.log(msg)
    if (!msg) return Promise.reject(new Error(SYNC_CODE.authFailed))
    const info = JSON.parse(msg)
    void setSyncAuthKey(serverId, info)
    return info
  })
}

const keyAuth = async(host: string, port: string, keyInfo: LX.Sync.KeyInfo) => {
  const msg = aesEncrypt(SYNC_CODE.authMsg + await getDeviceName(), keyInfo.key)
  return request(`http://${host}:${port}/ah`, { headers: { i: keyInfo.clientId, m: msg } }).then(({ text, code }) => {
    if (code != 200) throw new Error(SYNC_CODE.authFailed)

    let msg
    try {
      msg = aesDecrypt(text, keyInfo.key)
    } catch (err: any) {
      log.error('[auth] keyAuth decryptMsg error', err.message)
      throw new Error(SYNC_CODE.authFailed)
    }
    if (msg != SYNC_CODE.helloMsg) return Promise.reject(new Error(SYNC_CODE.authFailed))
  })
}

const auth = async(host: string, port: string, serverId: string, authCode?: string) => {
  if (authCode) return codeAuth(host, port, serverId, authCode)
  const keyInfo = await getSyncAuthKey(serverId)
  if (!keyInfo) throw new Error(SYNC_CODE.missingAuthCode)
  await keyAuth(host, port, keyInfo)
  return keyInfo
}

export default async(host: string, port: string, authCode?: string) => {
  console.log('connect: ', host, port, authCode)
  if (!await hello(host, port)) throw new Error(SYNC_CODE.connectServiceFailed)
  const serverId = await getServerId(host, port)
  if (!serverId) throw new Error(SYNC_CODE.getServiceIdFailed)
  return auth(host, port, serverId, authCode)
}
