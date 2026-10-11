const assert = require('node:assert/strict')
const fs = require('node:fs')
const crypto = require('node:crypto')
const engine = require(process.argv[2])
const events = []
const handle = engine.create((name, args) => {
  if (name === '__lx_native_call__') events.push({ action: args[1], data: JSON.parse(args[2]) })
  if (name === '__lx_native_call__utils_str2md5') return crypto.createHash('md5').update(decodeURIComponent(args[0])).digest('hex')
  if (name === '__lx_native_call__utils_str2b64') return Buffer.from(args[0]).toString('base64')
  if (name === '__lx_native_call__utils_b642buf') return JSON.stringify([...Buffer.from(args[0], 'base64')])
  if (name === '__lx_native_call__utils_aes_encrypt') {
    const key = Buffer.from(args[1], 'base64')
    const cipher = crypto.createCipheriv(`aes-${key.length * 8}-${args[3].includes('CBC') ? 'cbc' : 'ecb'}`, key, args[2] ? Buffer.from(args[2], 'base64') : null)
    return Buffer.concat([cipher.update(Buffer.from(args[0], 'base64')), cipher.final()]).toString('base64')
  }
  if (name === '__lx_native_call__utils_rsa_encrypt') throw new Error('native crypto probe failure')
  return ''
})
try {
  assert.equal(engine.evaluate(handle, '"歌词 🎵"', 'unicode.js'), '歌词 🎵')
  engine.evaluate(handle, fs.readFileSync(process.argv[3], 'utf8'), 'preload.js')
  engine.call(handle, 'lx_setup', ['key', 'id', 'name', '', '', '', '', ''])
  engine.evaluate(handle, `
    lx.on(lx.EVENT_NAMES.request, async () => 'https://example.test/song.mp3');
    lx.send(lx.EVENT_NAMES.inited, {sources: {kw: {type: 'music', actions: ['musicUrl'], qualitys: ['128k']}}});
  `, 'source.js')
  assert.equal(events[0].action, 'init')
  assert.equal(events[0].data.status, true)
  engine.call(handle, '__lx_native__', ['key', 'request', JSON.stringify({ requestKey: 'native-bridge', data: { source: 'kw', action: 'musicUrl', info: { type: '128k' } } })])
  assert.equal(events.at(-1).data.result.data.url, 'https://example.test/song.mp3')
  assert.equal(engine.evaluate(handle, "lx.utils.crypto.md5('歌词 🎵')", 'md5.js'), crypto.createHash('md5').update('歌词 🎵').digest('hex'))
  assert.equal(engine.evaluate(handle, "lx.utils.buffer.bufToString(lx.utils.buffer.from('hello'), 'base64')", 'base64.js'), 'aGVsbG8=')
  const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from('0123456789abcdef'), Buffer.from('0123456789abcdef'))
  const expected = Buffer.concat([cipher.update('hello'), cipher.final()]).toString('hex')
  assert.equal(engine.evaluate(handle, "lx.utils.buffer.bufToString(lx.utils.crypto.aesEncrypt('hello', 'aes-128-cbc', '0123456789abcdef', '0123456789abcdef'), 'hex')", 'aes.js'), expected)
  assert.throws(() => engine.evaluate(handle, "lx.utils.crypto.rsaEncrypt('hello', 'key')", 'host-error.js'), /native crypto probe failure/)
  assert.throws(() => engine.evaluate(handle, "throw new Error('source error')", 'throw.js'), /source error/)
  assert.throws(() => engine.call(handle, 'missing', []), /not a function/)
  assert.throws(() => engine.call(handle, '__lx_native__', Array(33).fill('')), /Too many native arguments/)
  assert.throws(() => engine.evaluate(handle, 'while (true) {}', 'timeout.js'), /timed out after 5000ms/)
  assert.equal(engine.evaluate(handle, '2 + 2', 'recover.js'), '4')
  assert.throws(() => engine.evaluate({}, '', ''), /bridge failed/)
} finally {
  engine.destroy(handle)
}
engine.destroy(handle)
assert.throws(() => engine.evaluate(handle, '1', 'destroyed.js'), /destroyed/)
assert.throws(() => engine.create(null), /bridge failed/)
console.log('PASS: native addon, preload, Unicode, crypto callbacks, promises, exceptions, timeout, destroy')
