import './shim'
import React, { useEffect, useState } from 'react'
import { AppRegistry, ScrollView, Text } from 'react-native'
import TrackPlayer, { Event, State, RepeatMode } from 'react-native-track-player'
import RNFS from 'react-native-fs'
import { Buffer } from '@craftzdog/react-native-buffer'
import BackgroundTimer from 'react-native-background-timer'

const probePath = RNFS.DocumentDirectoryPath + '/.lx-player-smoke.wav'
const pause = milliseconds => new Promise(resolve => BackgroundTimer.setTimeout(resolve, milliseconds))
const assert = (condition, message) => { if (!condition) throw new Error(message) }

function createAudio() {
  const sampleRate = 8000
  const seconds = 100
  const dataSize = sampleRate * seconds * 2
  const audio = Buffer.alloc(44 + dataSize)
  audio.write('RIFF', 0)
  audio.writeUInt32LE(36 + dataSize, 4)
  audio.write('WAVEfmt ', 8)
  audio.writeUInt32LE(16, 16)
  audio.writeUInt16LE(1, 20)
  audio.writeUInt16LE(1, 22)
  audio.writeUInt32LE(sampleRate, 24)
  audio.writeUInt32LE(sampleRate * 2, 28)
  audio.writeUInt16LE(2, 32)
  audio.writeUInt16LE(16, 34)
  audio.write('data', 36)
  audio.writeUInt32LE(dataSize, 40)
  for (let sample = 0; sample < sampleRate * seconds; sample++) {
    audio.writeInt16LE(Math.round(Math.sin(sample * 2 * Math.PI * 440 / sampleRate) * 1200), 44 + sample * 2)
  }
  return audio.toString('base64')
}

async function runChecks(report) {
  const changes = []
  const sub = TrackPlayer.addEventListener(Event.PlaybackTrackChanged, event => changes.push(event))
  const errorSub = TrackPlayer.addEventListener(Event.PlaybackError, event => report(`PLAYER ERROR: ${event.message}`))
  try {
    await RNFS.writeFile(probePath, createAudio(), 'base64')
    await TrackPlayer.setupPlayer({ autoUpdateMetadata: false })
    await TrackPlayer.updateOptions({ capabilities: [] })
    await TrackPlayer.setVolume(0.15)
    await TrackPlayer.setRate(1)
    await TrackPlayer.setRepeatMode(RepeatMode.Off)
    await TrackPlayer.add([
      { id: 'probe-older', url: probePath, title: 'Older probe' },
      { id: 'probe-audio', url: probePath, title: 'LX Harmony playback probe', artist: 'Local test' },
      { id: 'probe//default', url: probePath, title: 'Placeholder' },
    ])
    await TrackPlayer.skip(1)
    assert(Math.abs(await TrackPlayer.getDuration() - 100) < 1, 'Duration must be 100 seconds')
    await TrackPlayer.updateNowPlayingMetadata({ title: 'LX Harmony playback probe', artist: 'Local test', album: 'Probe album' }, false)
    await TrackPlayer.updateNowPlayingTitles({ lyric: '[00:00.00]Harmony playback test' })
    await TrackPlayer.play()
    await pause(1500)
    assert(await TrackPlayer.getState() === State.Playing, 'Player must enter Playing state')
    assert(await TrackPlayer.getPosition() > 0.5, 'Playback position must advance')
    report('Local WAV + metadata + playback PASS')
    await TrackPlayer.pause()
    const pausedAt = await TrackPlayer.getPosition()
    await pause(500)
    assert(await TrackPlayer.getState() === State.Paused, 'Player must enter Paused state')
    assert(Math.abs(await TrackPlayer.getPosition() - pausedAt) < 0.1, 'Paused position must remain stable')
    await TrackPlayer.seekTo(0)
    assert(await TrackPlayer.getPosition() < 0.1, 'Seek to zero failed')
    await TrackPlayer.seekTo(5)
    assert(Math.abs(await TrackPlayer.getPosition() - 5) < 0.3, 'Seek must use seconds')
    await TrackPlayer.remove(0)
    assert(await TrackPlayer.getCurrentTrack() === 0, 'Remove must adjust the active index')
    assert((await TrackPlayer.getTrack(0)).id === 'probe-audio', 'Active track changed after remove')
    report('Pause + seek(0/5s) + queue removal PASS')
    await TrackPlayer.updateNowPlayingMetadata({ title: 'Metadata regression probe', duration: -1 })
    await TrackPlayer.clearNowPlayingMetadata()
    report('Negative duration + empty metadata PASS')
    await TrackPlayer.play()
    report('BACKGROUND CHECK: press Home now; waiting 65 seconds...')
    const beforeBackground = await TrackPlayer.getPosition()
    await pause(65000)
    const afterBackground = await TrackPlayer.getPosition()
    assert(afterBackground - beforeBackground > 60, `Background progress too small: ${afterBackground - beforeBackground}s`)
    report(`65-second playback PASS (${afterBackground.toFixed(1)}s); verify Home/background in device logs`)
    await TrackPlayer.seekTo(99)
    await pause(2200)
    assert(await TrackPlayer.getCurrentTrack() === 1, 'Completion must advance to placeholder')
    assert(changes.some(event => event.track === 0 && event.nextTrack === 1 && event.isAutomatic === true), 'Automatic completion event missing')
    assert(changes.some(event => event.isAutomatic === false), 'Manual track change event missing')
    report('Completion + placeholder + legacy event PASS')
    await TrackPlayer.reset()
    assert((await TrackPlayer.getQueue()).length === 0, 'Reset must clear queue')
    await TrackPlayer.add({
      id: 'probe-http',
      url: 'http://127.0.0.1:18080/probe.wav',
      title: 'HTTP header probe',
      userAgent: 'LX-Harmony-Player-Probe',
      headers: { 'X-LX-Probe': 'header-required' },
    })
    await TrackPlayer.skip(0)
    assert(Math.abs(await TrackPlayer.getDuration() - 10) < 0.2, 'HTTP duration mismatch')
    await TrackPlayer.play()
    const streamingDeadline = Date.now() + 5000
    while (await TrackPlayer.getPosition() <= 0.1 && Date.now() < streamingDeadline) await pause(200)
    assert(await TrackPlayer.getPosition() > 0.1, `HTTP playback did not advance; state=${await TrackPlayer.getState()}`)
    await TrackPlayer.pause()
    report('HTTP streaming + User-Agent + custom headers PASS')
    await TrackPlayer.destroy()
    await TrackPlayer.setupPlayer()
    await TrackPlayer.destroy()
    report('Reset + destroy + reinitialize PASS')
    report('ALL PLAYER CHECKS PASSED')
  } finally {
    sub.remove()
    errorSub.remove()
    await TrackPlayer.destroy().catch(() => {})
    if (await RNFS.exists(probePath)) await RNFS.unlink(probePath)
  }
}

function PlayerSmoke() {
  const [lines, setLines] = useState(['Checking Harmony player...'])
  useEffect(() => {
    const report = message => {
      console.log('[HARMONY_PLAYER_SMOKE]', message)
      setLines(previous => [...previous, message])
    }
    void runChecks(report).catch(error => report(`FAIL: ${error.stack || error.message || error}`))
  }, [])
  return <ScrollView style={{ flex: 1, backgroundColor: '#ffffff', padding: 24 }}>
    <Text style={{ color: '#111111', fontSize: 18 }}>{lines.join('\n\n')}</Text>
  </ScrollView>
}

AppRegistry.registerComponent('lxmusic', () => PlayerSmoke)
