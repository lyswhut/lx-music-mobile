import './shim'
import React, { useEffect, useState } from 'react'
import { AppRegistry, ScrollView, Text } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as fs from './src/utils/fs'
import * as utils from './src/utils/nativeModules/utils'

const markerPath = fs.privateStorageDirectoryPath + '/.lx-harmony-native-smoke.json'
const compressedPath = markerPath + '.gz'
const restoredPath = markerPath + '.restored'
const storageKey = '@lx:harmony-native-smoke'
const payload = JSON.stringify({ version: 1, text: '歌词与设置读写 🎵', enabled: true })

async function runChecks(report) {
  const deviceName = await utils.getDeviceName()
  const locales = await utils.getSystemLocales()
  const supportedAbis = await utils.getSupportedAbis()
  const size = await utils.getWindowSize()
  const notifications = await utils.isNotificationsEnabled()
  if (!deviceName || !locales || !supportedAbis.length || !size.width || !size.height) {
    throw new Error('Invalid device information or window dimensions')
  }
  report(`Utils PASS: ${deviceName}, ${locales}, ${supportedAbis.join(',')}, ${size.width}x${size.height}px, notifications=${notifications}`)
  const address = await utils.getWIFIIPV4Address()
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(address)) throw new Error('Invalid IPv4 address')
  report('Wi-Fi IPv4 PASS')

  const cleanupPath = fs.temporaryDirectoryPath + '/.lx-harmony-cleanup-smoke'
  if (await fs.existsFile(cleanupPath)) await fs.unlink(cleanupPath)
  await fs.mkdir(cleanupPath)
  const cleanupFile = cleanupPath + '/file.txt'
  await fs.writeFile(cleanupFile, payload)
  await fs.unlink(cleanupFile)
  if (await fs.existsFile(cleanupFile)) throw new Error('File deletion failed')
  await fs.mkdir(cleanupPath + '/nested')
  await fs.writeFile(cleanupPath + '/nested/file.txt', payload)
  await fs.unlink(cleanupPath)
  if (await fs.existsFile(cleanupPath)) throw new Error('Directory deletion failed')
  report('File + nested directory deletion PASS')

  if (await fs.existsFile(markerPath) && await fs.existsFile(compressedPath)) {
    if (await fs.readFile(markerPath) !== payload) throw new Error('File did not survive restart')
    if (await AsyncStorage.getItem(storageKey) !== payload) throw new Error('Settings did not survive restart')
    await fs.unGzipFile(compressedPath, restoredPath)
    if (await fs.readFile(restoredPath) !== payload) throw new Error('gzip round trip failed')
    for (const filePath of [markerPath, compressedPath, restoredPath]) await fs.unlink(filePath)
    await AsyncStorage.removeItem(storageKey)
    report('Restart persistence + gzip PASS; probe data removed')
    report('ALL CHECKS PASSED')
  } else {
    await fs.writeFile(markerPath, payload)
    await AsyncStorage.setItem(storageKey, payload)
    await fs.gzipFile(markerPath, compressedPath)
    if (await fs.readFile(markerPath) !== payload) throw new Error('UTF-8 file round trip failed')
    report('UTF-8 file + settings write PASS')
    report('PHASE 1 PASS; restart the app to verify persistence')
  }
}

function NativeSmoke() {
  const [lines, setLines] = useState(['Checking native modules...'])
  useEffect(() => {
    const report = message => {
      console.log('[HARMONY_SMOKE]', message)
      setLines(previous => [...previous, message])
    }
    void runChecks(report).catch(error => report(`FAIL: ${error.stack || error.message}`))
  }, [])
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#ffffff', padding: 24 }}>
      <Text style={{ color: '#111111', fontSize: 18 }}>{lines.join('\n\n')}</Text>
    </ScrollView>
  )
}

AppRegistry.registerComponent('lxmusic', () => NativeSmoke)
