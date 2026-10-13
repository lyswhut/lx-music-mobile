const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const crypto = require('node:crypto')
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads')
const root = path.resolve(__dirname, '../../../../../../..')
const ts = require(path.join(root, 'node_modules/typescript'))
const etsRoot = path.join(root, 'harmony/entry/src/main/ets')

function load(filename, imports) {
  const source = fs.readFileSync(path.join(etsRoot, filename), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText
  const exports = {}
  const localRequire = name => {
    if (!(name in imports)) throw new Error(`Unexpected ETS import: ${name}`)
    return imports[name]
  }
  vm.runInNewContext(compiled, { exports, require: localRequire, setTimeout, clearTimeout, console }, { filename })
  return exports
}

const sources = `lx.send(lx.EVENT_NAMES.inited, {sources: {kw: {type: 'music', actions: ['musicUrl'], qualitys: ['128k']}}});`
const scriptInfo = script => ({ id: 'probe', name: 'Worker probe', description: '', version: '1', author: '', homepage: '', script })
const request = (requestKey, mode = '') => JSON.stringify({ requestKey, data: { source: 'kw', action: 'musicUrl', info: { type: '128k', mode } } })

if (!isMainThread) {
  const port = {
    postMessage: event => parentPort.postMessage(event),
    close: () => parentPort.close(),
  }
  class CryptoOperations {
    aesEncryptSync(text, key, iv, mode) {
      const keyBytes = Buffer.from(key, 'base64')
      const cipher = crypto.createCipheriv(`aes-${keyBytes.length * 8}-${mode.includes('CBC') ? 'cbc' : 'ecb'}`, keyBytes, iv ? Buffer.from(iv, 'base64') : null)
      return Buffer.concat([cipher.update(Buffer.from(text, 'base64')), cipher.final()]).toString('base64')
    }
    rsaEncryptSync(text, key) {
      return crypto.publicEncrypt({ key: { key: Buffer.from(key, 'base64'), type: 'spki', format: 'der' }, padding: crypto.constants.RSA_NO_PADDING }, Buffer.from(text, 'base64')).toString('base64')
    }
  }
  const imports = {
    '@ohos.worker': { workerPort: port },
    '@ohos.util': {
      generateRandomUUID: crypto.randomUUID,
      TextEncoder,
      Base64Helper: class {
        encodeToStringSync(bytes) { return Buffer.from(bytes).toString('base64') }
        decodeSync(text) { return new Uint8Array(Buffer.from(text, 'base64')) }
      },
    },
    '@ohos.buffer': { from: Buffer.from },
    '@ohos.security.cryptoFramework': {
      createMd: algorithm => {
        const digest = crypto.createHash(algorithm.toLowerCase())
        return { updateSync: blob => digest.update(blob.data), digestSync: () => ({ data: digest.digest() }) }
      },
    },
    'liblx_user_api.so': require(workerData.addon),
    '../nativeModules/CryptoOperations': { CryptoOperations },
  }
  imports['@ohos.util'].TextEncoder = class {
    encodeInto(text) { return new TextEncoder().encode(text) }
  }
  load('workers/UserApiWorker.ets', imports)
  parentPort.on('message', data => port.onmessage({ data }))
} else {
  const addon = process.argv[2]
  const preload = fs.readFileSync(process.argv[3])
  const workers = new Set()
  class ThreadWorker {
    constructor(workerPath) {
      assert.equal(workerPath, 'entry/ets/workers/UserApiWorker.ets')
      this.nodeWorker = new Worker(__filename, { workerData: { addon } })
      workers.add(this)
      this.nodeWorker.on('message', data => this.onmessage?.({ data }))
      this.nodeWorker.on('error', error => this.onerror?.({ message: error.message }))
      this.nodeWorker.on('exit', code => { workers.delete(this); this.onexit?.(code) })
    }
    postMessage(data) { this.nodeWorker.postMessage(data) }
    terminate() { return this.nodeWorker.terminate() }
  }
  const events = []
  const warnings = []
  let resourceDelay = 0
  const context = {
    rnInstance: { emitDeviceEvent: (name, event) => {
      assert.equal(name, 'api-action')
      events.push(event.data ? { ...event, data: JSON.parse(event.data) } : event)
    } },
    uiAbilityContext: { resourceManager: { getRawFileContent: () => new Promise(resolve => setTimeout(() => resolve(new Uint8Array(preload)), resourceDelay)) } },
    logger: { warn: message => warnings.push(message) },
  }
  const { UserApiModule } = load('nativeModules/UserApiModule.ets', {
    '@rnoh/react-native-openharmony': { UITurboModule: class { constructor(ctx) { this.ctx = ctx } __onDestroy__() {} } },
    '@ohos.worker': { ThreadWorker },
    '@ohos.buffer': { from: Buffer.from },
  })
  const module = new UserApiModule(context)
  const waitFor = async (predicate, timeout = 8000) => {
    const deadline = Date.now() + timeout
    while (!predicate()) {
      if (Date.now() > deadline) throw new Error(`Timed out; events=${JSON.stringify(events.slice(-5))}`)
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }
  const reload = async script => {
    events.length = 0
    module.loadScript(scriptInfo(script))
    await waitFor(() => events.some(event => event.action === 'init'))
  }
  const response = key => events.find(event => event.action === 'response' && event.data.requestKey === key)
  ;(async () => {
    try {
      await reload(`
        lx.on(lx.EVENT_NAMES.request, async ({info}) => {
          if (info.mode === 'timer') return new Promise(resolve => setTimeout(() => resolve('https://example.test/timer.mp3'), 15));
          if (info.mode === 'network') return new Promise((resolve, reject) => lx.request('https://example.test/request', {}, (error, response, body) => error ? reject(error) : resolve(body.url)));
          if (info.mode === 'abort') return new Promise((resolve, reject) => { const abort = lx.request('https://example.test/request', {}, (error, response, body) => error ? reject(error) : resolve(body.url)); abort(); });
          if (info.mode === 'throw') throw new Error('probe request failed');
          if (info.mode === 'crypto') {
            if (lx.utils.crypto.md5('') !== 'd41d8cd98f00b204e9800998ecf8427e') throw new Error('empty MD5 mismatch');
            if (lx.utils.crypto.md5('hello') !== '5d41402abc4b2a76b9719d911017c592') throw new Error('MD5 mismatch');
            if (lx.utils.buffer.bufToString(lx.utils.buffer.from('hello'), 'base64') !== 'aGVsbG8=') throw new Error('Base64 mismatch');
            if (lx.utils.buffer.bufToString(lx.utils.buffer.from([0, 128, 255]), 'base64') !== 'AID/') throw new Error('Binary Base64 mismatch');
            if (lx.utils.buffer.bufToString(lx.utils.buffer.from('歌词 🎵'), 'utf8') !== '歌词 🎵') throw new Error('UTF8 mismatch');
          }
          return 'https://example.test/song.mp3';
        });
        ${sources}
      `)
      assert.equal(events.find(event => event.action === 'init').data.status, true)
      for (const mode of ['normal', 'timer', 'crypto', 'throw']) {
        module.sendAction('request', request(mode, mode))
        await waitFor(() => response(mode))
        assert.equal(response(mode).data.status, mode !== 'throw')
      }
      module.sendAction('request', request('network', 'network'))
      await waitFor(() => events.some(event => event.action === 'request'))
      const nativeRequest = events.find(event => event.action === 'request').data
      module.sendAction('response', JSON.stringify({ requestKey: nativeRequest.requestKey, error: null, response: { statusCode: 200, body: { url: 'https://example.test/network.mp3' } } }))
      await waitFor(() => response('network'))
      assert.equal(response('network').data.result.data.url, 'https://example.test/network.mp3')
      module.sendAction('request', request('abort', 'abort'))
      await waitFor(() => events.some(event => event.action === 'cancelRequest'))
      const cancellation = events.find(event => event.action === 'cancelRequest')
      module.sendAction('response', JSON.stringify({ requestKey: cancellation.data, error: 'request canceled', response: null }))
      await waitFor(() => response('abort'))
      assert.equal(response('abort').data.status, false)
      await reload("throw new Error('load probe failed')")
      assert.equal(events.find(event => event.action === 'init').data.status, false)
      assert.match(events.find(event => event.action === 'init').data.errorMessage, /load probe failed/)
      let heartbeat = 0
      const interval = setInterval(() => heartbeat++, 20)
      try {
        await reload('while (true) {}')
        assert.match(events.find(event => event.action === 'init').data.errorMessage, /timed out after 5000ms/)
        assert.ok(heartbeat > 150, 'Main thread stalled while script loop ran')
      } finally { clearInterval(interval) }
      await reload(`lx.on(lx.EVENT_NAMES.request, async () => 'https://example.test/recover.mp3'); ${sources}`)
      module.sendAction('request', request('recover'))
      await waitFor(() => response('recover'))
      assert.equal(response('recover').data.status, true)
      await reload(`lx.on(lx.EVENT_NAMES.request, async () => { while (true) {} }); ${sources}`)
      module.sendAction('request', request('loop-request'))
      await waitFor(() => response('loop-request'))
      assert.equal(response('loop-request').data.status, false)
      assert.match(response('loop-request').data.errorMessage, /timed out after 5000ms/)
      await waitFor(() => workers.size === 0)
      await reload(sources)
      module.destroy()
      await waitFor(() => workers.size === 0)
      assert.throws(() => module.sendAction('request', '{}'), /not loaded/)
      resourceDelay = 100
      events.length = 0
      module.loadScript(scriptInfo(sources))
      module.destroy()
      await waitFor(() => workers.size === 0)
      await new Promise(resolve => setTimeout(resolve, 150))
      assert.equal(events.length, 0, 'Destroyed worker emitted stale init')
      resourceDelay = 0
      events.length = 0
      module.loadScript(scriptInfo(''))
      await waitFor(() => events.some(event => event.action === 'init'), 25000)
      assert.match(events.find(event => event.action === 'init').data.errorMessage, /initialization timed out/)
      await waitFor(() => workers.size === 0)
      resourceDelay = 0
      await reload(`${sources}; setTimeout(() => console.log('stale timer fired'), 200)`)
      await reload(sources)
      await new Promise(resolve => setTimeout(resolve, 250))
      assert.ok(!events.some(event => event.log?.includes('stale timer fired')), 'Previous script timer leaked')
      module.__onDestroy__()
      await waitFor(() => workers.size === 0)
      events.length = 0
      module.loadScript(scriptInfo(sources))
      await new Promise(resolve => setTimeout(resolve, 50))
      assert.equal(workers.size, 0, 'Disposed module spawned worker')
      assert.equal(warnings.length, 0)
      console.log('PASS: ETS host/worker, network/cancel, timer, crypto callbacks, load errors, 5s timeout without UI stall, switch, disposal')
    } finally {
      module.destroy()
      await Promise.all([...workers].map(worker => worker.terminate()))
    }
  })().catch(error => { console.error(error); process.exitCode = 1 })
}
