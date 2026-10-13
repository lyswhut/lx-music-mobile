import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'
import { instrumentSource } from '../../../../../../../scripts/harmony-source-diagnostic-server.mjs'

const engine = createRequire(import.meta.url)(process.argv[2])
const events = []
let rawScript
const host = (name, args) => {
  if (name === '__lx_native_call__') events.push({ action: args[1], data: JSON.parse(args[2]) })
  if (name === 'log') events.push({ action: 'log', data: { log: args.join(' ') } })
  if (name === '__lx_native_call__utils_str2md5') {
    rawScript = decodeURIComponent(args[0])
    return crypto.createHash('md5').update(rawScript).digest('hex')
  }
  return ''
}
const handle = engine.create(host)
const script = `/**\n * @name Fixture\n * @version 7\n */
const sourceApi = globalThis.lx;
if (sourceApi.currentScriptInfo.name !== 'Fixture' || sourceApi.currentScriptInfo.version !== '7') throw new Error('Metadata changed');
sourceApi.utils.crypto.md5(sourceApi.currentScriptInfo.rawScript);
sourceApi.on(sourceApi.EVENT_NAMES.request, () => new Promise((resolve, reject) => {
  const cancel = sourceApi.request('https://example.test/music', { method: 'GET', headers: { 'User-Agent': 'source-agent', Authorization: 'private-token', tag: 'source-tag' } }, (error, response, body) => {
    if (error) return reject(error);
    if (response.statusCode !== 201 || response.headers.custom !== 'header-value') return reject(new Error('Response changed'));
    resolve(body.url);
  });
  if (typeof cancel !== 'function') reject(new Error('Cancellation missing'));
}));
sourceApi.send(sourceApi.EVENT_NAMES.inited, { sources: { kw: { type: 'music', actions: ['musicUrl'], qualitys: ['128k'] } } });
`
try {
  engine.evaluate(handle, fs.readFileSync(process.argv[3], 'utf8'), 'preload.js')
  engine.call(handle, 'lx_setup', ['key', 'diagnostic-id', '[诊断] Fixture', '', '7', '', '', 'wrapped-script'])
  engine.evaluate(handle, instrumentSource(script, 'http://127.0.0.1:18080/events'), 'diagnostic.js')
  assert.equal(rawScript, script)
  assert.equal(events.find(event => event.action === 'init').data.status, true)
  engine.call(handle, '__lx_native__', ['key', 'request', JSON.stringify({ requestKey: 'song', data: { source: 'kw', action: 'musicUrl', info: { type: '128k' } } })])
  const request = events.find(event => event.action === 'request' && event.data.url === 'https://example.test/music').data
  assert.deepEqual(request.options.headers, { 'User-Agent': 'source-agent', Authorization: 'private-token', tag: 'source-tag' })
  const diagnostic = events.find(event => event.action === 'request' && event.data.options.body?.event === 'request').data.options.body
  assert.deepEqual(diagnostic.headers, { 'User-Agent': 'source-agent', Authorization: '[omitted]', tag: 'source-tag' })
  assert.equal(JSON.stringify(diagnostic).includes('private-token'), false)
  engine.call(handle, '__lx_native__', ['key', 'response', JSON.stringify({ requestKey: request.requestKey, error: null, response: { statusCode: 201, headers: { custom: 'header-value' }, body: { url: 'https://example.test/song.mp3' } } })])
  assert.equal(events.find(event => event.action === 'response').data.result.data.url, 'https://example.test/song.mp3')
  const responseDiagnostic = events.find(event => event.action === 'request' && event.data.options.body?.event === 'response').data.options.body
  assert.equal(responseDiagnostic.statusCode, 201)
  assert.equal(responseDiagnostic.error, null)
} finally {
  engine.destroy(handle)
}
console.log('PASS: source diagnostics preserve frozen preload, script identity, request and response; redact credentials')
events.length = 0
rawScript = undefined
const localHandle = engine.create(host)
try {
  engine.evaluate(localHandle, fs.readFileSync(process.argv[3], 'utf8'), 'preload.js')
  engine.call(localHandle, 'lx_setup', ['key', 'local-id', '[诊断] Fixture', '', '7', '', '', 'local-script'])
  engine.evaluate(localHandle, instrumentSource(script), 'local-diagnostic.js')
  assert.equal(rawScript, script)
  assert.equal(events.find(event => event.action === 'init').data.status, true)
  assert.equal(events.filter(event => event.action === 'request').length, 0)
  engine.call(localHandle, '__lx_native__', ['key', 'request', JSON.stringify({ requestKey: 'song', data: { source: 'kw', action: 'musicUrl', info: { type: '128k' } } })])
  assert.equal(events.filter(event => event.action === 'request').length, 1)
  assert.equal(events.find(event => event.action === 'request' && event.data.url === 'https://example.test/music').data.options.headers.Authorization, 'private-token')
  const requestLog = events.find(event => event.action === 'log' && event.data.log.includes('"event":"request"')).data.log
  assert.equal(requestLog.includes('https://example.test/music'), true)
  assert.equal(requestLog.includes('private-token'), false)
  const request = events.find(event => event.action === 'request').data
  engine.call(localHandle, '__lx_native__', ['key', 'response', JSON.stringify({ requestKey: request.requestKey, error: null, response: { statusCode: 201, headers: { custom: 'header-value' }, body: { url: 'https://example.test/song.mp3' } } })])
  assert.equal(events.find(event => event.action === 'response').data.result.data.url, 'https://example.test/song.mp3')
  const responseLog = events.find(event => event.action === 'log' && event.data.log.includes('"event":"response"')).data.log
  assert.equal(responseLog.includes('"statusCode":201'), true)
  assert.equal(responseLog.includes('https://example.test/song.mp3'), false)
  assert.equal(events.filter(event => event.action === 'request').length, 1)
} finally {
  engine.destroy(localHandle)
}
console.log('PASS: local diagnostics log requests and responses without collector requests')
