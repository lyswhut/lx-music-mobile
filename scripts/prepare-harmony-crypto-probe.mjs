import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = path.resolve(import.meta.dirname, '..')
const plaintext = '歌词与设置 🎵'
const aes = []
for (const keyLength of [16, 24, 32]) {
  for (const mode of ['AES/CBC/PKCS7Padding', 'AES', 'AES/ECB/NoPadding', 'AES/ECB/PKCS7Padding']) {
    const key = Buffer.alloc(keyLength, 7)
    const iv = mode.includes('CBC') ? Buffer.from('0123456789012345') : null
    const input = mode.endsWith('NoPadding') ? '0123456789abcdef' : mode === 'AES/ECB/PKCS7Padding' ? '' : plaintext
    const cipher = crypto.createCipheriv(`aes-${keyLength * 8}-${iv ? 'cbc' : 'ecb'}`, key, iv)
    cipher.setAutoPadding(!mode.endsWith('NoPadding'))
    aes.push({ key: key.toString('base64'), iv: iv?.toString('base64') ?? '', mode, plaintext: input, ciphertext: Buffer.concat([cipher.update(input, 'utf8'), cipher.final()]).toString('base64') })
  }
}
const rsa = []
for (const modulusLength of [1024, 2048]) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength })
  const input = Buffer.alloc(modulusLength / 8)
  input[input.length - 1] = 42
  const rawCiphertext = crypto.publicEncrypt({ key: publicKey, padding: crypto.constants.RSA_NO_PADDING }, input)
  const oaepCiphertext = crypto.publicEncrypt({ key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha1' }, Buffer.from(plaintext))
  rsa.push({ modulusLength, publicKey: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'), privateKey: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'), rawPlaintext: input.toString('base64'), rawCiphertext: rawCiphertext.toString('base64'), oaepCiphertext: oaepCiphertext.toString('base64') })
}
const target = path.join(root, 'harmony/entry/src/main/resources/rawfile/crypto-probe.json')
fs.writeFileSync(target, JSON.stringify({ plaintext, sha1: crypto.createHash('sha1').update(plaintext).digest('hex'), md5: crypto.createHash('md5').update(plaintext).digest('hex'), aes, rsa }))
