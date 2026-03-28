const { inflate } = require('pako')
const iconv = require('iconv-lite')

const handleInflate = data => new Promise((resolve, reject) => {
  resolve(Buffer.from(inflate(data)))
})

const buf_key = Buffer.from('yeelion')
const buf_key_len = buf_key.length

const decodeLyric = async(buf, isGetLyricx) => {
  // const info = buf.slice(0, index).toString()
  // if (!info.startsWith('tp=content')) return null
  // const isLyric = info.includes('\r\nlrcx=0\r\n')
  if (buf.toString('utf8', 0, 10) != 'tp=content') return ''
  // console.log(buf)
  // const index = buf.indexOf('\r\n\r\n') + 4
  const lrcData = await handleInflate(buf.slice(buf.indexOf('\r\n\r\n') + 4))

  if (!isGetLyricx) return iconv.decode(lrcData, 'gb18030')

  const buf_str = Buffer.from(lrcData.toString(), 'base64')
  const buf_str_len = buf_str.length
  const output = new Uint16Array(buf_str_len)
  let i = 0
  while (i < buf_str_len) {
    let j = 0
    while (j < buf_key_len && i < buf_str_len) {
      output[i] = buf_str[i] ^ buf_key[j]
      i++
      j++
    }
  }

  return iconv.decode(Buffer.from(output), 'gb18030')
}
export default async({ lrcBuffer, isGetLyricx }) => {
  const lrc = await decodeLyric(lrcBuffer, isGetLyricx)
  // console.log(lrc)
  return Buffer.from(lrc).toString('base64')
}
