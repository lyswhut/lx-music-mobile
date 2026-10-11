import http from 'node:http'

const sampleRate = 8000
const samples = sampleRate * 10
const audio = Buffer.alloc(44 + samples * 2)
audio.write('RIFF', 0)
audio.writeUInt32LE(36 + samples * 2, 4)
audio.write('WAVEfmt ', 8)
audio.writeUInt32LE(16, 16)
audio.writeUInt16LE(1, 20)
audio.writeUInt16LE(1, 22)
audio.writeUInt32LE(sampleRate, 24)
audio.writeUInt32LE(sampleRate * 2, 28)
audio.writeUInt16LE(2, 32)
audio.writeUInt16LE(16, 34)
audio.write('data', 36)
audio.writeUInt32LE(samples * 2, 40)
for (let sample = 0; sample < samples; sample++) {
  audio.writeInt16LE(Math.round(Math.sin(sample * 2 * Math.PI * 440 / sampleRate) * 1200), 44 + sample * 2)
}

const server = http.createServer((request, response) => {
  if (request.url === '/source-probe' && request.headers['x-lx-probe'] === 'source-required' &&
    request.headers['user-agent'] === 'lx-music/mobile' && request.headers.ver === '2.0.0' &&
    request.headers['source-ver'] === '1' && request.headers.tag === '5b0a20223231353538323939222c0a20223132386b220a5d') {
    console.log('Source request headers verified')
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ url: 'https://example.test/network.mp3' }))
    return
  }
  if (request.url !== '/probe.wav' || request.headers['x-lx-probe'] !== 'header-required' ||
    request.headers['user-agent'] !== 'LX-Harmony-Player-Probe') {
    response.writeHead(403)
    response.end('Missing probe headers')
    return
  }
  console.log('HTTP probe headers verified')
  response.writeHead(200, { 'Content-Type': 'audio/wav', 'Content-Length': audio.length })
  response.end(audio)
})

server.listen(18080, '127.0.0.1', () => console.log('Player probe server ready on 127.0.0.1:18080'))
