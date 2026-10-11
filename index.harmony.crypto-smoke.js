import './shim'
import React, { useEffect, useState } from 'react'
import { AppRegistry, ScrollView, Text } from 'react-native'
import RNFS from 'react-native-fs'
import { Buffer } from '@craftzdog/react-native-buffer'
import * as crypto from './src/utils/nativeModules/crypto'

function equal(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`)
}

async function runChecks(report) {
  const fixtures = JSON.parse(await RNFS.readFileAssets('crypto-probe.json', 'utf8'))
  equal(await crypto.hashSHA1(fixtures.plaintext), fixtures.sha1, 'SHA1 UTF-8')
  report('SHA1 UTF-8 PASS')
  equal(await crypto.hashSHA1(''), 'da39a3ee5e6b4b0d3255bfef95601890afd80709', 'SHA1 empty')
  report('SHA1 PASS')
  for (const fixture of fixtures.aes) {
    report(`Checking AES ${Buffer.from(fixture.key, 'base64').length * 8} ${fixture.mode}`)
    const input = Buffer.from(fixture.plaintext).toString('base64')
    equal(crypto.aesEncryptSync(input, fixture.key, fixture.iv, fixture.mode), fixture.ciphertext, 'AES sync Node vector')
    equal(await crypto.aesEncrypt(input, fixture.key, fixture.iv, fixture.mode), fixture.ciphertext, 'AES async Node vector')
    equal(crypto.aesDecryptSync(fixture.ciphertext, fixture.key, fixture.iv, fixture.mode), fixture.plaintext, 'AES sync decrypt')
    equal(await crypto.aesDecrypt(fixture.ciphertext, fixture.key, fixture.iv, fixture.mode), fixture.plaintext, 'AES async decrypt')
  }
  report('AES 128/192/256 CBC/ECB PKCS7 + NoPadding Node vectors PASS')
  for (const fixture of fixtures.rsa) {
    report(`Checking RSA ${fixture.modulusLength}`)
    equal(crypto.rsaEncryptSync(fixture.rawPlaintext, fixture.publicKey, crypto.RSA_PADDING.NoPadding), fixture.rawCiphertext, 'RSA raw Node vector')
    equal(await crypto.rsaEncrypt(fixture.rawPlaintext, fixture.publicKey, crypto.RSA_PADDING.NoPadding), fixture.rawCiphertext, 'RSA raw async Node vector')
    equal(crypto.rsaDecryptSync(fixture.oaepCiphertext, fixture.privateKey, crypto.RSA_PADDING.OAEPWithSHA1AndMGF1Padding), fixtures.plaintext, 'RSA OAEP Node decrypt')
    equal(await crypto.rsaDecrypt(fixture.oaepCiphertext, fixture.privateKey, crypto.RSA_PADDING.OAEPWithSHA1AndMGF1Padding), fixtures.plaintext, 'RSA OAEP async Node decrypt')
    const encrypted = crypto.rsaEncryptSync(Buffer.from(fixtures.plaintext).toString('base64'), fixture.publicKey, crypto.RSA_PADDING.OAEPWithSHA1AndMGF1Padding)
    equal(crypto.rsaDecryptSync(encrypted, fixture.privateKey, crypto.RSA_PADDING.OAEPWithSHA1AndMGF1Padding), fixtures.plaintext, 'RSA OAEP roundtrip')
    report(`RSA ${fixture.modulusLength} raw/OAEP sync + async PASS`)
  }
  const pair = await crypto.generateRsaKey()
  const encrypted = await crypto.rsaEncrypt(Buffer.from(fixtures.plaintext).toString('base64'), pair.publicKey, crypto.RSA_PADDING.OAEPWithSHA1AndMGF1Padding)
  equal(await crypto.rsaDecrypt(encrypted, pair.privateKey, crypto.RSA_PADDING.OAEPWithSHA1AndMGF1Padding), fixtures.plaintext, 'Generated PEM key pair')
  report('Generated RSA2048 PEM key pair PASS')
  let rejected = false
  try { await crypto.aesEncrypt('aGVsbG8=', 'a2V5', '', 'AES') } catch { rejected = true }
  if (!rejected) throw new Error('Invalid key did not reject')
  report('Invalid AES key rejection PASS')
  report('ALL CRYPTO CHECKS PASSED')
}

function CryptoSmoke() {
  const [lines, setLines] = useState(['Checking cryptography...'])
  useEffect(() => {
    const report = message => {
      console.log('[HARMONY_CRYPTO]', message)
      setLines(previous => [...previous, message])
    }
    void runChecks(report).catch(error => report(`FAIL: ${error.stack || error.message || JSON.stringify(error)}`))
  }, [])
  return <ScrollView style={{ flex: 1, backgroundColor: '#ffffff', padding: 24 }}><Text style={{ color: '#111111', fontSize: 18 }}>{lines.join('\n\n')}</Text></ScrollView>
}

AppRegistry.registerComponent('lxmusic', () => CryptoSmoke)
