import { createCipheriv, createDecipheriv, generateKeyPair, publicEncrypt, privateDecrypt, constants } from 'crypto'
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

export const aesEncrypt = (text: string, key: string) => {
  const cipher = createCipheriv('aes-128-ecb', Buffer.from(key, 'base64'), '')
  return Buffer.concat([cipher.update(Buffer.from(text)), cipher.final()]).toString('base64')
}

export const aesDecrypt = (text: string, key: string) => {
  const decipher = createDecipheriv('aes-128-ecb', Buffer.from(key, 'base64'), '')
  return Buffer.concat([decipher.update(Buffer.from(text, 'base64')), decipher.final()]).toString()
}

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
      if (err) return reject(err)
      resolve({
        publicKey,
        privateKey,
      })
    },
  )
})

export const rsaEncrypt = (buffer: Buffer, key: string): string => {
  return publicEncrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING }, buffer).toString('base64')
}
export const rsaDecrypt = (buffer: Buffer, key: string): Buffer => {
  return privateDecrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING }, buffer)
}


export const encryptMsg = (msg: string) => {
  return msg
  // return `${createHash('md5').update(msg).digest('hex')}${msg}`
  // const keyInfo = global.lx.syncKeyInfo
  // if (!keyInfo) return ''
  // return aesEncrypt(msg, keyInfo.key)
}

export const decryptMsg = (enMsg: string) => {
  return enMsg
  // const keyInfo = global.lx.syncKeyInfo
  // if (!keyInfo) return ''
  // let msg = ''
  // try {
  //   msg = aesDecrypt(enMsg, keyInfo.key, keyInfo.iv)
  // } catch (err) {
  //   console.log(err)
  // }
  // return msg
}
