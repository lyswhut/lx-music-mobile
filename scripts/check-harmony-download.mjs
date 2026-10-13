import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile('harmony/entry/src/main/ets/nativeModules/DownloadModule.ets', 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
const files = new Map()
const descriptors = new Map()
const permissions = []
const events = []
let nextDescriptor = 1
let selection = 'file://docs/storage/Users/currentUser/Download'
let selectedTimes = 0
let responseCode = 200
let responseBody = Buffer.from('ID3-valid-mp3-test-data')
let responseTotal = responseBody.length
let stall = false
let copyFailure = false
let partialWrites = false
let lastHeaders
let preference = ''
let activeRequest
let permissionFailure = false
const directory = '/storage/Users/currentUser/Download/LX Music'
const fileSystem = {
  OpenMode: { READ_ONLY: 0, READ_WRITE: 2, CREATE: 64, TRUNC: 512 },
  access: async path => files.has(path),
  mkdir: async path => { files.set(path, Buffer.alloc(0)) },
  openSync: (path, mode) => {
    if (!files.has(path)) {
      if (!(mode & 64)) throw new Error('missing file')
      files.set(path, Buffer.alloc(0))
    }
    const file = { fd: nextDescriptor++ }
    descriptors.set(file.fd, path)
    return file
  },
  open: async(path, mode) => fileSystem.openSync(path, mode),
  closeSync: file => { descriptors.delete(file.fd) },
  close: async file => { descriptors.delete(file.fd) },
  writeSync: (descriptor, buffer) => {
    const path = descriptors.get(descriptor)
    assert.ok(path, 'writes require an open file')
    const written = partialWrites ? Math.min(3, buffer.byteLength) : buffer.byteLength
    files.set(path, Buffer.concat([files.get(path), Buffer.from(buffer).subarray(0, written)]))
    return written
  },
  readSync: (descriptor, buffer) => {
    const content = files.get(descriptors.get(descriptor))
    new Uint8Array(buffer).set(content.subarray(0, buffer.byteLength))
    return Math.min(content.length, buffer.byteLength)
  },
  unlink: async path => { files.delete(path) },
  copyFile: async(from, to) => {
    files.set(to, Buffer.from(files.get(from)))
    if (copyFailure) throw new Error('disk full')
  },
}
class DocumentPicker {
  async save() { return ['file://docs/storage/Users/currentUser/Download/com.wingsluo.lxmusic'] }
  async select() {
    selectedTimes++
    return selection ? [selection] : []
  }
}
class Request {
  listeners = new Map()
  on(event, handler) { this.listeners.set(event, handler) }
  destroy() { this.destroyed = true }
  async requestInStream(url, options) {
    assert.match(url, /^https?:/)
    lastHeaders = options.header
    if (stall) return new Promise(() => {})
    this.listeners.get('dataReceiveProgress')?.({ totalSize: responseTotal, receiveSize: 0 })
    const bytes = Uint8Array.from(responseBody)
    this.listeners.get('dataReceive')?.(bytes.buffer)
    this.listeners.get('dataEnd')?.()
    return responseCode
  }
}
class TurboModule {
  constructor() {
    this.ctx = { uiAbilityContext: { cacheDir: '/cache' }, rnInstance: { emitDeviceEvent: (name, data) => events.push({ name, data }) } }
  }
  __onDestroy__() {}
}
const dependencies = {
  '@rnoh/react-native-openharmony': { UITurboModule: TurboModule },
  '@ohos.file.picker': { default: { DocumentViewPicker: DocumentPicker, DocumentPickerMode: { DOWNLOAD: 1 }, DocumentSelectMode: { FOLDER: 1 } } },
  '@ohos.file.fs': { default: fileSystem },
  '@ohos.file.fileuri': { default: { FileUri: class { constructor(uri) { this.path = decodeURI(uri.replace('file://docs', '')) } } } },
  '@ohos.fileshare': { default: {
    OperationMode: { READ_MODE: 1, WRITE_MODE: 2, CREATE_MODE: 4 },
    activatePermission: async policy => {
      assert.equal(policy[0].operationMode, 3, 'phone directory authorization supports read/write policy')
      permissions.push(policy)
    },
    persistPermission: async policy => {
      assert.equal(policy[0].operationMode, 3, 'do not request unsupported CREATE_MODE from phone picker')
      if (permissionFailure) throw Object.assign(new Error('Operation not permitted'), { code: 13900001 })
      permissions.push(policy)
    },
  } },
  '@ohos.data.preferences': { default: { getPreferences: async() => ({ get: async() => preference, put: async(_key, value) => { preference = value }, delete: async() => { preference = '' }, flush: async() => {} }) } },
  '@ohos.net.http': { default: { RequestMethod: { GET: 'GET' }, createHttp: () => { activeRequest = new Request(); return activeRequest } } },
  '@ohos.deviceInfo': { default: { sdkApiVersion: 26 } },
}
const exports = {}
vm.runInNewContext(compiled, { exports, require: name => {
  assert.ok(dependencies[name], `unexpected dependency ${name}`)
  return dependencies[name]
}, Uint8Array, ArrayBuffer, Date, Error, Map, Promise, console })
const DownloadModule = exports.DownloadModule
const module = new DownloadModule()
assert.equal(await module.prepareDirectory(), directory)
assert.equal(selectedTimes, 1)
assert.ok(permissions.length >= 2)
const first = await module.downloadMusic('first', 'https://example.test/song', 'Song/Name - Artist')
assert.equal(first, `${directory}/Song_Name - Artist.mp3`)
assert.deepEqual(files.get(first), responseBody)
partialWrites = true
const partial = await module.downloadMusic('partial-write', 'https://example.test/song', 'Partial write')
assert.deepEqual(files.get(partial), responseBody)
partialWrites = false
assert.match(lastHeaders['User-Agent'], /Mozilla/)
responseCode = 206
const partialResponse = await module.downloadMusic('partial-response', 'https://example.test/song', 'Partial response')
assert.deepEqual(files.get(partialResponse), responseBody)
responseCode = 200
const second = await module.downloadMusic('second', 'https://example.test/song', 'Song/Name - Artist')
assert.equal(second, `${directory}/Song_Name - Artist (1).mp3`)
assert.deepEqual(files.get(first), responseBody)
const restored = new DownloadModule()
assert.equal(await restored.prepareDirectory(), directory)
assert.equal(selectedTimes, 1, 'persistent authorization should skip picker')
const assertClean = () => {
  assert.equal(descriptors.size, 0, 'all file descriptors must close')
  assert.equal([...files.keys()].some(path => path.endsWith('.part')), false, 'temporary files must be removed')
}
responseCode = 404
await assert.rejects(module.downloadMusic('missing', 'https://example.test/missing', 'Missing'), /404/)
assertClean()
responseCode = 200
responseBody = Buffer.from('<html>error page</html>')
responseTotal = responseBody.length
await assert.rejects(module.downloadMusic('html', 'https://example.test/html', 'HTML'), /音频/)
assertClean()
responseBody = Buffer.from('ID3-truncated')
responseTotal = responseBody.length + 10
await assert.rejects(module.downloadMusic('truncated', 'https://example.test/song', 'Truncated'), /不完整/)
assertClean()
responseTotal = responseBody.length
copyFailure = true
await assert.rejects(module.downloadMusic('copy', 'https://example.test/song', 'Copy'), /disk full/)
assert.equal(files.has(`${directory}/Copy.mp3`), false, 'failed copies must be removed')
copyFailure = false
assertClean()
stall = true
const cancelled = module.downloadMusic('cancel', 'https://example.test/song', 'Cancelled')
await new Promise(resolve => setTimeout(resolve, 0))
await assert.rejects(module.downloadMusic('concurrent', 'https://example.test/song', 'Concurrent'), /正在下载/)
module.cancelDownload('different-task')
assert.equal(activeRequest.destroyed, undefined)
module.cancelDownload('cancel')
await assert.rejects(cancelled, /取消/)
assertClean()
stall = false
await module.downloadMusic('after-cancel', 'https://example.test/song', 'After cancel')
assertClean()
for (const [signature, extension] of [['fLaC', 'flac'], ['RIFF0000WAVE', 'wav'], ['OggS', 'ogg'], ['0000ftyp', 'm4a'], ['MAC ', 'ape']]) {
  responseBody = Buffer.from(signature)
  responseTotal = responseBody.length
  const path = await module.downloadMusic(`format-${extension}`, 'https://example.test/song', `Format ${extension}`)
  assert.ok(path.endsWith(`.${extension}`))
}
assertClean()
preference = ''
selection = 'file://docs/storage/Users/currentUser/Documents'
await assert.rejects(new DownloadModule().prepareDirectory(), /Download/)
selection = ''
assert.equal(await new DownloadModule().prepareDirectory(), '')
selection = 'file://docs/storage/Users/currentUser/Download'
permissionFailure = true
await assert.rejects(new DownloadModule().prepareDirectory(), /保存目录授权失败.*13900001/)
assert.equal(preference, '', 'failed authorization must not be remembered')
permissionFailure = false
assertClean()
assert.ok(events.some(event => event.name === 'lx-download-progress' && event.data.received > 0))
console.log('PASS: folder authorization, persistence, download bytes, headers, duplicate names, HTTP failure, invalid media, truncation, failed copy cleanup, cancellation and retry')

const businessSource = await readFile('src/core/download.ts', 'utf8')
const businessCode = ts.transpileModule(businessSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
let directoryResolver
let urlResolver
let urlRejecter
let directoryRejecter
let nativeResolver
let urlRequests = 0
let nativeRequests = 0
let progressHandler
let nativeCancelId = ''
let capturedArguments
const fakeNative = {
  prepareDirectory: () => new Promise((resolve, reject) => { directoryResolver = resolve; directoryRejecter = reject }),
  downloadMusic: (id, url, name) => {
    nativeRequests++
    capturedArguments = { id, url, name }
    return new Promise(resolve => { nativeResolver = resolve })
  },
  cancelDownload: id => { nativeCancelId = id },
}
const businessDependencies = {
  'react-native': { Platform: { OS: 'harmony' }, DeviceEventEmitter: { addListener: (_name, handler) => { progressHandler = handler } }, TurboModuleRegistry: { getEnforcing: name => { assert.equal(name, 'LXDownload'); return fakeNative } } },
  '@/core/music': { getMusicUrl: options => {
    assert.equal(options.allowToggleSource, false, 'download must not switch to a different song')
    assert.equal(options.isRefresh, true)
    assert.equal(options.quality, '128k')
    urlRequests++
    return new Promise((resolve, reject) => { urlResolver = resolve; urlRejecter = reject })
  } },
  '@/core/music/utils': { getPlayQuality: () => '128k' },
  '@/store/setting/state': { default: { setting: { 'player.playQuality': '128k' } } },
}
const business = {}
vm.runInNewContext(businessCode, { exports: business, require: name => businessDependencies[name],
  setTimeout, Set, Date, Error, String,
  global: { lx: { qualityList: { kw: ['128k', '320k'] } }, i18n: { t: key => key } },
})
const song = { source: 'kw', name: 'Vienna', singer: 'Billy Joel', meta: { _qualitys: { '128k': {} } } }
const flush = () => new Promise(resolve => setTimeout(resolve, 1))
business.requestMusicDownload(song)
await flush()
assert.equal(business.getDownloadState().status, 'ready')
assert.deepEqual([...business.getDownloadQualities(song)], ['128k'])
const preparing = business.startMusicDownload('128k')
business.cancelMusicDownload()
assert.equal(business.getDownloadState().status, 'cancelling')
directoryResolver(directory)
await preparing
assert.equal(business.getDownloadState().status, 'cancelled')
assert.equal(urlRequests, 0, 'cancelled authorization must not resolve music URL')
const resolving = business.startMusicDownload('128k')
directoryResolver(directory)
await flush()
assert.equal(business.getDownloadState().status, 'resolving')
business.cancelMusicDownload()
urlResolver('https://example.test/song')
await resolving
assert.equal(business.getDownloadState().status, 'cancelled')
assert.equal(nativeRequests, 0, 'cancelled resolution must not start native download')
const successful = business.startMusicDownload('128k')
directoryResolver(directory)
await flush()
urlResolver('https://example.test/song')
await flush()
assert.equal(business.getDownloadState().status, 'downloading')
progressHandler({ id: 'unrelated-task', received: 999, total: 999 })
assert.equal(business.getDownloadState().received, 0)
progressHandler({ id: capturedArguments.id, received: 64, total: 100 })
assert.equal(business.getDownloadState().received, 64)
business.closeDownload()
assert.equal(business.getDownloadState().visible, true, 'active dialog must not disappear')
nativeResolver(`${directory}/Vienna.mp3`)
await successful
assert.equal(business.getDownloadState().status, 'completed')
assert.equal(business.getDownloadState().path, `${directory}/Vienna.mp3`)
assert.equal(capturedArguments.name, 'Vienna - Billy Joel [128k]')
assert.ok(nativeCancelId.startsWith('download-'))
business.closeDownload()
assert.equal(business.getDownloadState().visible, false)
const timedOut = business.startMusicDownload('128k')
directoryResolver(directory)
await flush()
urlRejecter(new Error('Aborted'))
await timedOut
assert.equal(business.getDownloadState().status, 'failed')
assert.equal(business.getDownloadState().error, 'music_download_source_timeout')
const rejectedSource = business.startMusicDownload('128k')
directoryResolver(directory)
await flush()
urlRejecter({ message: 'source unavailable' })
await rejectedSource
assert.match(business.getDownloadState().error, /music_download_source_failed.*source unavailable/)
const emptySourceError = business.startMusicDownload('128k')
directoryResolver(directory)
await flush()
urlRejecter(new Error(''))
await emptySourceError
assert.equal(business.getDownloadState().error, 'music_download_source_failed')
const rejectedDirectory = business.startMusicDownload('128k')
directoryRejecter({ message: '保存目录授权失败：Operation not permitted (13900001)' })
await rejectedDirectory
assert.match(business.getDownloadState().error, /保存目录授权失败.*13900001/)
console.log('PASS: business states, cancellation during authorization and URL resolution, supported quality, explicit source, progress isolation and completed path')
