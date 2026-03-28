// import { createCipheriv, createDecipheriv, publicEncrypt, privateDecrypt, constants } from 'crypto'
import { aesEncryptSync, aesDecryptSync, rsaEncryptSync, rsaDecryptSync, AES_MODE, RSA_PADDING } from '@/utils/nativeModules/crypto'
import { btoa } from 'react-native-quick-base64'


export const aesEncrypt = (text: string, b64Key: string) => {
  // const cipher = createCipheriv('aes-128-ecb', Buffer.from(key, 'base64'), '')
  // return Buffer.concat([cipher.update(Buffer.from(text)), cipher.final()]).toString('base64')
  return aesEncryptSync(btoa(text), b64Key, '', AES_MODE.ECB_128_NoPadding)
}

export const aesDecrypt = (text: string, b64Key: string) => {
  // const decipher = createDecipheriv('aes-128-ecb', Buffer.from(key, 'base64'), '')
  // return Buffer.concat([decipher.update(Buffer.from(text, 'base64')), decipher.final()]).toString()
  return aesDecryptSync(text, b64Key, '', AES_MODE.ECB_128_NoPadding)
}

export const rsaEncrypt = (buffer: Buffer, key: string): string => {
  // return publicEncrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING }, buffer).toString('base64')
  return rsaEncryptSync(buffer.toString('base64'), key, RSA_PADDING.OAEPWithSHA1AndMGF1Padding)
}
export const rsaDecrypt = (buffer: Buffer, key: string): string => {
  // return privateDecrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING }, buffer)
  return rsaDecryptSync(buffer.toString('base64'), key, RSA_PADDING.OAEPWithSHA1AndMGF1Padding)
}
