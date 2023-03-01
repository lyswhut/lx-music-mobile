import { generateKeyPair } from 'crypto'
import BackgroundTimer from 'react-native-background-timer'

export const request = async(url: string, { timeout = 10000, ...options }: RequestInit & { timeout?: number } = {}) => {
  const controller = new AbortController()
  let id: number | null = BackgroundTimer.setTimeout(() => {
    id = null
    controller.abort()
  }, timeout)
  return fetch(url, {
    ...options,
    signal: controller.signal,
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  }).then(async(response) => {
    const text = await response.text()
    return {
      text,
      code: response.status,
    }
  }).catch(err => {
    // console.log(err, err.code, err.message)
    throw err
  }).finally(() => {
    if (id == null) return
    BackgroundTimer.clearTimeout(id)
  })
}


// export const aesEncrypt = (text: string, key: string, iv: string) => {
//   const cipher = createCipheriv('aes-128-cbc', Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'))
//   return Buffer.concat([cipher.update(Buffer.from(text)), cipher.final()]).toString('base64')
// }

// export const aesDecrypt = (text: string, key: string, iv: string) => {
//   const decipher = createDecipheriv('aes-128-cbc', Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'))
//   return Buffer.concat([decipher.update(Buffer.from(text, 'base64')), decipher.final()]).toString()
// }

export const generateRsaKey = async() => new Promise<{ publicKey: string, privateKey: string }>((resolve, reject) => {
  generateKeyPair(
    'rsa',
    {
      modulusLength: 2048, // It holds a number. It is the key size in bits and is applicable for RSA, and DSA algorithm only.
      publicKeyEncoding: {
        type: 'spki', // Note the type is pkcs1 not spki
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8', // Note again the type is set to pkcs1
        format: 'pem',
        // cipher: "aes-256-cbc", //Optional
        // passphrase: "", //Optional
      },
    },
    (err, publicKey, privateKey) => {
      if (err) {
        reject(err)
        return
      }
      resolve({
        publicKey,
        privateKey,
      })
    },
  )
})


export const encryptMsg = (keyInfo: LX.Sync.KeyInfo, msg: string): string => {
  return msg
  // if (!keyInfo) return ''
  // return aesEncrypt(msg, keyInfo.key, keyInfo.iv)
}

export const decryptMsg = (keyInfo: LX.Sync.KeyInfo, enMsg: string): string => {
  return enMsg
  // if (!keyInfo) return ''
  // let msg = ''
  // try {
  //   msg = aesDecrypt(enMsg, keyInfo.key, keyInfo.iv)
  // } catch (err) {
  //   console.log(err)
  // }
  // return msg
}


export const parseUrl = (href: string): LX.Sync.UrlInfo => {
  // const url = new URL(host)
  // console.log(host)
  // let hostPath = url.host + url.pathname
  // let href = url.href
  if (href.endsWith('/')) href = href.replace(/\/$/, '')
  // if (href.endsWith('/')) href = href.replace(/\/$/, '')
  const httpProtocol = /^https:/.test(href) ? 'https:' : 'http:'

  console.log({
    wsProtocol: httpProtocol == 'https:' ? 'wss:' : 'ws:',
    httpProtocol,
    hostPath: href.replace(httpProtocol + '//', ''),
    href,
  })

  return {
    wsProtocol: httpProtocol == 'https:' ? 'wss:' : 'ws:',
    httpProtocol,
    hostPath: href.replace(httpProtocol + '//', ''),
    href,
  }
}


export const sendStatus = (status: LX.Sync.Status) => {
  // syncLog.log(JSON.stringify(status))
}
