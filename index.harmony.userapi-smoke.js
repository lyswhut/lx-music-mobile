import './shim'
import React, { useEffect, useState } from 'react'
import { AppRegistry, ScrollView, Text } from 'react-native'
import BackgroundTimer from 'react-native-background-timer'
import RNFS from 'react-native-fs'
import { Buffer } from '@craftzdog/react-native-buffer'
import { stringMd5 } from 'react-native-quick-md5'
import { fetchData } from './src/core/init/userApi/request'
import { loadScript, sendAction, onScriptAction, destroy } from './src/utils/nativeModules/userApi'

const pause = milliseconds => new Promise(resolve => BackgroundTimer.setTimeout(resolve, milliseconds))
const info = script => ({ id: 'harmony-source-probe', name: 'Source probe', description: '', version: '1', author: '', homepage: '', allowShowUpdateAlert: false, script })
const initScript = `lx.send(lx.EVENT_NAMES.inited, {sources: {kw: {type: 'music', actions: ['musicUrl'], qualitys: ['128k']}}});`
const sourceScript = `
lx.on(lx.EVENT_NAMES.request, async ({info}) => {
  if (info.mode === 'timer') return new Promise(resolve => setTimeout(() => resolve('https://example.test/timer.mp3'), 20));
  if (info.mode === 'network') return new Promise((resolve, reject) => lx.request('http://127.0.0.1:18080/source-probe', { headers: { 'X-LX-Probe': 'source-required' } }, (error, response, body) => error ? reject(error) : resolve(body.url)));
  if (info.mode === 'error') throw new Error('source probe error');
  if (info.mode === 'loop') { while (true) {} }
  if (lx.utils.crypto.md5('hello') !== '5d41402abc4b2a76b9719d911017c592') throw new Error('MD5 mismatch');
  if (lx.utils.crypto.md5('') !== 'd41d8cd98f00b204e9800998ecf8427e') throw new Error('empty MD5 mismatch');
  if (lx.utils.buffer.bufToString(lx.utils.buffer.from('hello'), 'base64') !== 'aGVsbG8=') throw new Error('Base64 mismatch');
  return 'https://example.test/song.mp3';
});
${initScript}
`

async function runChecks(report) {
  const fixtures = JSON.parse(await RNFS.readFileAssets('crypto-probe.json', 'utf8'))
  const aes = fixtures.aes.filter(fixture => Buffer.from(fixture.key, 'base64').length === 16 && ['AES/CBC/PKCS7Padding', 'AES'].includes(fixture.mode))
    .map(fixture => ({ ...fixture, expectedHex: Buffer.from(fixture.ciphertext, 'base64').toString('hex') }))
  const rsa = fixtures.rsa.map(fixture => ({ ...fixture, expectedHex: Buffer.from(fixture.rawCiphertext, 'base64').toString('hex') }))
  const cryptoScript = `
    const allBytes = Array.from({ length: 256 }, (_, index) => index);
    if (lx.utils.buffer.bufToString(lx.utils.buffer.from(allBytes), 'base64') !== '${Buffer.from(Array.from({ length: 256 }, (_, index) => index)).toString('base64')}') throw new Error('Binary Base64 mismatch');
    if (lx.utils.buffer.bufToString(lx.utils.buffer.from('${fixtures.plaintext}'), 'utf8') !== '${fixtures.plaintext}') throw new Error('Unicode roundtrip mismatch');
    for (const fixture of ${JSON.stringify(aes)}) {
      const encrypted = lx.utils.crypto.aesEncrypt(lx.utils.buffer.from(fixture.plaintext), fixture.mode === 'AES' ? 'aes-128-ecb' : 'aes-128-cbc', lx.utils.buffer.from(fixture.key, 'base64'), lx.utils.buffer.from(fixture.iv, 'base64'));
      if (lx.utils.buffer.bufToString(encrypted, 'hex') !== fixture.expectedHex) throw new Error('Worker AES Node vector mismatch');
    }
    for (const fixture of ${JSON.stringify(rsa)}) {
      const encrypted = lx.utils.crypto.rsaEncrypt(lx.utils.buffer.from(fixture.rawPlaintext, 'base64'), fixture.publicKey);
      if (lx.utils.buffer.bufToString(encrypted, 'hex') !== fixture.expectedHex) throw new Error('Worker RSA Node vector mismatch');
    }
  `
  if (stringMd5(fixtures.plaintext) !== fixtures.md5) throw new Error('App MD5 fallback mismatch')
  const events = []
  const unsubscribe = onScriptAction(event => {
    events.push(event)
    if (event.action === 'request') {
      const request = fetchData(event.data.url, event.data.options)
      request.request.then(response => sendAction('response', { requestKey: event.data.requestKey, error: null, response }))
        .catch(error => sendAction('response', { requestKey: event.data.requestKey, error: error.message, response: null }))
    }
  })
  const waitFor = async predicate => {
    const deadline = Date.now() + 9000
    while (!predicate()) {
      if (Date.now() >= deadline) throw new Error(`Event timeout: ${JSON.stringify(events.slice(-3))}`)
      await pause(20)
    }
  }
  const reload = async script => {
    events.length = 0
    loadScript(info(script))
    await waitFor(() => events.some(event => event.action === 'init'))
    return events.find(event => event.action === 'init').data
  }
  const request = async mode => {
    sendAction('request', { requestKey: mode, data: { source: 'kw', action: 'musicUrl', info: { type: '128k', mode } } })
    await waitFor(() => events.some(event => event.action === 'response' && event.data.requestKey === mode))
    return events.find(event => event.action === 'response' && event.data.requestKey === mode).data
  }
  try {
    const initial = await reload(cryptoScript + sourceScript)
    if (!initial.status) throw new Error(initial.errorMessage || 'Source init failed')
    report('Worker AES/RSA Node vectors + app MD5 fallback PASS')
    report('Script init + source registration PASS')
    for (const mode of ['normal', 'timer', 'network']) {
      const response = await request(mode)
      if (!response.status) throw new Error(response.errorMessage)
      const expected = mode === 'normal' ? 'song' : mode
      if (response.result.data.url !== `https://example.test/${expected}.mp3`) throw new Error('URL response mismatch')
    }
    report('Promise + timer + network callback + MD5/Base64 PASS')
    const errorResponse = await request('error')
    if (errorResponse.status || !errorResponse.errorMessage.includes('source probe error')) throw new Error('Script error did not propagate')
    report('Request rejection PASS')
    let heartbeats = 0
    let running = true
    const heartbeat = async () => {
      while (running) { await pause(50); heartbeats++ }
    }
    const heartbeatTask = heartbeat()
    try {
      const loopResponse = await request('loop')
      if (loopResponse.status || !loopResponse.errorMessage.includes('timed out')) throw new Error('Loop did not time out')
      if (heartbeats < 40) throw new Error('Script execution blocked the app thread')
    } finally {
      running = false
      await heartbeatTask
    }
    report('5-second execution limit + app heartbeat PASS')
    const failed = await reload("throw new Error('load probe error')")
    if (failed.status || !failed.errorMessage.includes('load probe error')) throw new Error('Load error missing')
    if (!(await reload(sourceScript)).status || !(await request('normal')).status) throw new Error('Reload failed')
    report('Load error + switch + recovery PASS')
    destroy()
    report('ALL USER API CHECKS PASSED')
  } finally {
    unsubscribe()
    destroy()
  }
}

function UserApiSmoke() {
  const [lines, setLines] = useState(['Checking custom source sandbox...'])
  useEffect(() => {
    const report = message => { console.log('[HARMONY_USER_API]', message); setLines(previous => [...previous, message]) }
    void runChecks(report).catch(error => report(`FAIL: ${error.stack || error.message || error}`))
  }, [])
  return <ScrollView style={{ flex: 1, backgroundColor: '#ffffff', padding: 24 }}><Text style={{ color: '#111111', fontSize: 18 }}>{lines.join('\n\n')}</Text></ScrollView>
}

AppRegistry.registerComponent('lxmusic', () => UserApiSmoke)
