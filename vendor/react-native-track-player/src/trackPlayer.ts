import { Platform, AppRegistry, DeviceEventEmitter, NativeEventEmitter, NativeModules } from 'react-native'
// @ts-ignore
import * as resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource'
import {
  MetadataOptions,
  PlayerOptions,
  Event,
  Track,
  State,
  TrackMetadataBase,
  NowPlayingMetadata,
  RepeatMode,
  NowPlayingTitles,
} from './interfaces'

const { TrackPlayerModule: TrackPlayer } = NativeModules
const emitter = Platform.OS !== 'android' ? new NativeEventEmitter(TrackPlayer) : DeviceEventEmitter

let isSetupedPlayer = false

// MARK: - Helpers

function resolveImportedPath(path?: number | string) {
  if (!path) return undefined
  return resolveAssetSource(path) || path
}

// MARK: - General API

async function setupPlayer(options: PlayerOptions = {}): Promise<void> {
  isSetupedPlayer = true
  return TrackPlayer.setupPlayer(options || {})
}

function destroy() {
  isSetupedPlayer = false
  return TrackPlayer.destroy()
}

type ServiceHandler = () => Promise<void>
function registerPlaybackService(factory: () => ServiceHandler) {
  if (Platform.OS === 'android') {
    // Registers the headless task
    AppRegistry.registerHeadlessTask('TrackPlayer', factory)
  } else {
    // Initializes and runs the service in the next tick
    setImmediate(factory())
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addEventListener(event: Event, listener: (data: any) => void) {
  return emitter.addListener(event, listener)
}

// MARK: - Queue API

async function add(tracks: Track | Track[], insertBeforeIndex?: number): Promise<void> {
  // Clone the array before modifying it
  if (Array.isArray(tracks)) {
    tracks = [...tracks]
  } else {
    tracks = [tracks]
  }

  if (tracks.length < 1) return

  for (let i = 0; i < tracks.length; i++) {
    // Clone the object before modifying it
    tracks[i] = { ...tracks[i] }

    // Resolve the URLs
    tracks[i].url = resolveImportedPath(tracks[i].url)
    tracks[i].artwork = resolveImportedPath(tracks[i].artwork)
  }

  // Note: we must be careful about passing nulls to non nullable parameters on Android.
  return TrackPlayer.add(tracks, insertBeforeIndex === undefined ? -1 : insertBeforeIndex)
}

async function remove(tracks: number | number[]): Promise<void> {
  if (!isSetupedPlayer) return Promise.resolve()
  if (!Array.isArray(tracks)) {
    tracks = [tracks]
  }

  return TrackPlayer.remove(tracks)
}

async function removeUpcomingTracks(): Promise<void> {
  if (!isSetupedPlayer) return Promise.resolve()
  return TrackPlayer.removeUpcomingTracks()
}

async function skip(trackIndex: number): Promise<void> {
  if (!isSetupedPlayer) return Promise.resolve()
  return TrackPlayer.skip(trackIndex)
}

async function skipToNext(): Promise<void> {
  if (!isSetupedPlayer) return Promise.resolve()
  return TrackPlayer.skipToNext()
}

async function skipToPrevious(): Promise<void> {
  if (!isSetupedPlayer) return Promise.resolve()
  return TrackPlayer.skipToPrevious()
}

// MARK: - Control Center / Notifications API

async function updateOptions(options: MetadataOptions = {}): Promise<void> {
  options = { ...options }

  // Resolve the asset for each icon
  options.icon = resolveImportedPath(options.icon)
  options.playIcon = resolveImportedPath(options.playIcon)
  options.pauseIcon = resolveImportedPath(options.pauseIcon)
  options.stopIcon = resolveImportedPath(options.stopIcon)
  options.previousIcon = resolveImportedPath(options.previousIcon)
  options.nextIcon = resolveImportedPath(options.nextIcon)
  options.rewindIcon = resolveImportedPath(options.rewindIcon)
  options.forwardIcon = resolveImportedPath(options.forwardIcon)

  return TrackPlayer.updateOptions(options)
}

async function updateMetadataForTrack(trackIndex: number, metadata: TrackMetadataBase): Promise<void> {
  if (!isSetupedPlayer) return Promise.resolve()
  // Clone the object before modifying it
  metadata = Object.assign({}, metadata)

  // Resolve the artwork URL
  metadata.artwork = resolveImportedPath(metadata.artwork)

  return TrackPlayer.updateMetadataForTrack(trackIndex, metadata)
}

function clearNowPlayingMetadata(): Promise<void> {
  if (!isSetupedPlayer) return Promise.resolve()
  return TrackPlayer.clearNowPlayingMetadata()
}

function updateNowPlayingMetadata(metadata: NowPlayingMetadata, playing: boolean): Promise<void> {
  if (!isSetupedPlayer) return Promise.resolve()
  // Clone the object before modifying it
  metadata = Object.assign({}, metadata)

  // Resolve the artwork URL
  metadata.artwork = resolveImportedPath(metadata.artwork)

  return TrackPlayer.updateNowPlayingMetadata(metadata, playing)
}

async function updateNowPlayingTitles(titles: NowPlayingTitles): Promise<void> {
  return TrackPlayer.updateNowPlayingTitles(titles)
}

// MARK: - Player API

async function reset(): Promise<void> {
  return TrackPlayer.reset()
}

async function play(): Promise<void> {
  if (!isSetupedPlayer) return Promise.resolve()
  return TrackPlayer.play()
}

async function pause(): Promise<void> {
  if (!isSetupedPlayer) return Promise.resolve()
  return TrackPlayer.pause()
}

async function stop(): Promise<void> {
  if (!isSetupedPlayer) return Promise.resolve()
  return TrackPlayer.stop()
}

async function seekTo(position: number): Promise<void> {
  if (!isSetupedPlayer) return Promise.resolve()
  return TrackPlayer.seekTo(position)
}

async function setVolume(level: number): Promise<void> {
  if (!isSetupedPlayer) return Promise.resolve()
  return TrackPlayer.setVolume(level)
}

async function setRate(rate: number): Promise<void> {
  if (!isSetupedPlayer) return Promise.resolve()
  return TrackPlayer.setRate(rate)
}

async function setRepeatMode(mode: RepeatMode): Promise<RepeatMode> {
  return TrackPlayer.setRepeatMode(mode)
}

// MARK: - Getters

async function getVolume(): Promise<number> {
  return TrackPlayer.getVolume()
}

async function getRate(): Promise<number> {
  if (!isSetupedPlayer) return Promise.resolve(0)
  return TrackPlayer.getRate()
}

async function getTrack(trackIndex: number): Promise<Track | null> {
  if (!isSetupedPlayer) return Promise.resolve(null)
  return TrackPlayer.getTrack(trackIndex)
}

async function getQueue(): Promise<Track[]> {
  if (!isSetupedPlayer) return Promise.resolve([])
  return TrackPlayer.getQueue()
}

async function getCurrentTrack(): Promise<number> {
  if (!isSetupedPlayer) return Promise.resolve(-1)
  return TrackPlayer.getCurrentTrack()
}

async function getDuration(): Promise<number> {
  if (!isSetupedPlayer) return Promise.resolve(0)
  return (await TrackPlayer.getDuration()) / 1000
}

async function getBufferedPosition(): Promise<number> {
  if (!isSetupedPlayer) return Promise.resolve(0)
  return (await TrackPlayer.getBufferedPosition()) / 1000
}

async function getPosition(): Promise<number> {
  if (!isSetupedPlayer) return Promise.resolve(0)
  return (await TrackPlayer.getPosition()) / 1000
}

async function getState(): Promise<State> {
  if (!isSetupedPlayer) return Promise.resolve(State.None)
  return TrackPlayer.getState()
}

async function getRepeatMode(): Promise<RepeatMode> {
  if (!isSetupedPlayer) return Promise.resolve(RepeatMode.Off)
  return TrackPlayer.getRepeatMode()
}

async function isCached(url: string): Promise<boolean> {
  if (!isSetupedPlayer) return false
  return TrackPlayer.isCached(url)
}

async function getCacheSize(): Promise<number> {
  if (!isSetupedPlayer) return 0
  return TrackPlayer.getCacheSize()
}

async function clearCache(): Promise<void> {
  if (!isSetupedPlayer) return
  return TrackPlayer.clearCache()
}

export default {
  // MARK: - General API
  setupPlayer,
  destroy,
  registerPlaybackService,
  addEventListener,

  // MARK: - Queue API
  add,
  remove,
  removeUpcomingTracks,
  skip,
  skipToNext,
  skipToPrevious,

  // MARK: - Control Center / Notifications API
  updateOptions,
  updateMetadataForTrack,
  clearNowPlayingMetadata,
  updateNowPlayingMetadata,
  updateNowPlayingTitles,

  // MARK: - Player API
  reset,
  play,
  pause,
  stop,
  seekTo,
  setVolume,
  setRate,
  setRepeatMode,

  // MARK: - Getters
  getVolume,
  getRate,
  getTrack,
  getQueue,
  getCurrentTrack,
  getDuration,
  getBufferedPosition,
  getPosition,
  getState,
  getRepeatMode,
  isCached,
  getCacheSize,
  clearCache
}
