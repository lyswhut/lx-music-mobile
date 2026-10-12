const { inflate } = require('pako')

const handleInflate = data => new Promise((resolve, reject) => {
  resolve(Buffer.from(inflate(data)))
})

const buf_key = Buffer.from('yeelion')
const buf_key_len = buf_key.length

const decodeLyric = async(rawData, isGetLyricx) => {
  const buf = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData)
  if (buf.toString('utf8', 0, 10).toLowerCase() !== 'tp=content') return ''
  const lrcData = await handleInflate(buf.subarray(buf.indexOf('\r\n\r\n') + 4))
  if (!isGetLyricx) return lrcData.toString('utf8')
  const buf_str = Buffer.from(lrcData.toString(), 'base64')
  const buf_str_len = buf_str.length
  const output = new Uint8Array(buf_str_len)
  let i = 0
  while (i < buf_str_len) {
    let j = 0
    while (j < buf_key_len && i < buf_str_len) {
      output[i] = buf_str[i] ^ buf_key[j]
      i++
      j++
    }
  }

  return Buffer.from(output).toString('utf8')
}
export default async({ lrcBuffer, isGetLyricx }) => {
  const lrc = await decodeLyric(lrcBuffer, isGetLyricx)
  return lrc
}
