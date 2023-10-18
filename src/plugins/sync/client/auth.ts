import { request, generateRsaKey } from './utils'
import { getSyncAuthKey, setSyncAuthKey } from '../data'
import log from '../log'
import { aesDecrypt, aesEncrypt, rsaDecrypt } from '../utils'
import { getDeviceName } from '@/utils/nativeModules/utils'
import { toMD5 } from '@/utils/tools'
import { SYNC_CODE } from '../constants'

const hello = async(urlInfo: LX.Sync.UrlInfo) => request(`${urlInfo.httpProtocol}//${urlInfo.hostPath}/hello`)
  .then(({ text }) => {
    if (text == SYNC_CODE.helloMsg) return true
    if (text.startsWith('Hello~::^-^::')) {
      const verRxp = /v(\d+)/
      let result = verRxp.exec(text)?.[1]
      if (result != null) {
        const servVer = parseInt(result)
        const localVer = parseInt(verRxp.exec(SYNC_CODE.helloMsg)![1])
        if (servVer > localVer) throw new Error(SYNC_CODE.highServiceVersion)
        else if (servVer < localVer) throw new Error(SYNC_CODE.lowServiceVersion)
      }
    }
    return false
  })
  .catch((err: any) => {
    log.error('[auth] hello', err.message)
    console.log(err)
    return false
  })

const getServerId = async(urlInfo: LX.Sync.UrlInfo) => request(`${urlInfo.httpProtocol}//${urlInfo.hostPath}/id`)
  .then(({ text }) => {
    if (!text.startsWith(SYNC_CODE.idPrefix)) return ''
    return text.replace(SYNC_CODE.idPrefix, '')
  })
  .catch((err: any) => {
    log.error('[auth] getServerId', err.message)
    console.log(err)
    throw err
  })

const codeAuth = async(urlInfo: LX.Sync.UrlInfo, serverId: string, authCode: string) => {
  let key = toMD5(authCode).substring(0, 16)
  // const iv = Buffer.from(key.split('').reverse().join('')).toString('base64')
  key = Buffer.from(key).toString('base64')
  let { publicKey, privateKey } = await generateRsaKey()
  publicKey = publicKey.replace(/\n/g, '')
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
  const msg = aesEncrypt(`${SYNC_CODE.authMsg}\n${publicKey}\n${await getDeviceName()}\nlx_music_mobile`, key)
  // console.log(msg, key)
  return request(`${urlInfo.httpProtocol}//${urlInfo.hostPath}/ah`, { headers: { m: msg } }).then(async({ text, code }) => {
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
    const info = JSON.parse(msg) as LX.Sync.KeyInfo
    void setSyncAuthKey(serverId, info)
    return info
  })
}

const keyAuth = async(urlInfo: LX.Sync.UrlInfo, keyInfo: LX.Sync.KeyInfo) => {
  const msg = aesEncrypt(SYNC_CODE.authMsg + await getDeviceName(), keyInfo.key)
  return request(`${urlInfo.httpProtocol}//${urlInfo.hostPath}/ah`, { headers: { i: keyInfo.clientId, m: msg } }).then(async({ text, code }) => {
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

const auth = async(urlInfo: LX.Sync.UrlInfo, serverId: string, authCode?: string) => {
  if (authCode) return codeAuth(urlInfo, serverId, authCode)
  const keyInfo = await getSyncAuthKey(serverId)
  if (!keyInfo) throw new Error(SYNC_CODE.missingAuthCode)
  await keyAuth(urlInfo, keyInfo)
  return keyInfo
}

export default async(urlInfo: LX.Sync.UrlInfo, authCode?: string) => {
  console.log('connect: ', urlInfo.href, authCode)
  console.log(`${urlInfo.httpProtocol}//${urlInfo.hostPath}/hello`)
  if (!await hello(urlInfo)) throw new Error(SYNC_CODE.connectServiceFailed)
  const serverId = await getServerId(urlInfo)
  if (!serverId) throw new Error(SYNC_CODE.getServiceIdFailed)
  return auth(urlInfo, serverId, authCode)
}
