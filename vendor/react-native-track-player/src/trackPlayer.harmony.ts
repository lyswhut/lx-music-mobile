import { DeviceEventEmitter, Image, TurboModuleRegistry, type TurboModule } from 'react-native'
import {
  type MetadataOptions, type PlayerOptions, Event, type Track, State,
  type TrackMetadataBase, type NowPlayingMetadata, RepeatMode, type NowPlayingTitles,
} from './interfaces'

interface PlayerSpec extends TurboModule {
  setupPlayer(options: string): Promise<void>
  destroy(): Promise<void>
  add(tracks: string, insertBeforeIndex: number): Promise<void>
  remove(indexes: string): Promise<void>
  removeUpcomingTracks(): Promise<void>
  skip(index: number): Promise<void>
  skipToNext(): Promise<void>
  skipToPrevious(): Promise<void>
  updateOptions(options: string): Promise<void>
  updateMetadataForTrack(index: number, metadata: string): Promise<void>
  clearNowPlayingMetadata(): Promise<void>
  updateNowPlayingMetadata(metadata: string): Promise<void>
  updateNowPlayingTitles(titles: string): Promise<void>
  reset(): Promise<void>
  play(): Promise<void>
  pause(): Promise<void>
  stop(): Promise<void>
  seekTo(seconds: number): Promise<void>
  setVolume(volume: number): Promise<void>
  setRate(rate: number): Promise<void>
  setRepeatMode(mode: number): Promise<void>
  getVolume(): Promise<number>
  getRate(): Promise<number>
  getQueue(): Promise<string>
  getCurrentTrack(): Promise<number>
  getDuration(): Promise<number>
  getBufferedPosition(): Promise<number>
  getPosition(): Promise<number>
  getState(): Promise<number>
  getRepeatMode(): Promise<number>
}

const native = TurboModuleRegistry.getEnforcing<PlayerSpec>('LXTrackPlayer')
let initialized = false

function resolvePath(path: string | number | undefined): string | undefined {
  if (typeof path !== 'number') return path
  const asset = Image.resolveAssetSource(path)
  if (!asset?.uri) throw new Error('Unable to resolve audio asset')
  return asset.uri
}

function serializeMetadata(metadata: TrackMetadataBase) {
  return JSON.stringify({ ...metadata, artwork: resolvePath(metadata.artwork) })
}

const player = {
  async setupPlayer(options: PlayerOptions = {}) {
    await native.setupPlayer(JSON.stringify(options))
    initialized = true
  },
  async destroy() {
    await native.destroy()
    initialized = false
  },
  registerPlaybackService(factory: () => () => Promise<void>) {
    setImmediate(factory())
  },
  addEventListener(event: Event, listener: (data: any) => void) {
    return DeviceEventEmitter.addListener(event, listener)
  },
  async add(tracks: Track | Track[], insertBeforeIndex = -1) {
    const resolved = (Array.isArray(tracks) ? tracks : [tracks]).map(track => ({
      ...track,
      url: resolvePath(track.url),
      artwork: resolvePath(track.artwork),
    }))
    if (resolved.length) await native.add(JSON.stringify(resolved), insertBeforeIndex)
  },
  remove(indexes: number | number[]) {
    return native.remove(JSON.stringify(Array.isArray(indexes) ? indexes : [indexes]))
  },
  removeUpcomingTracks: () => native.removeUpcomingTracks(),
  skip: (index: number) => native.skip(index),
  skipToNext: () => native.skipToNext(),
  skipToPrevious: () => native.skipToPrevious(),
  updateOptions: (options: MetadataOptions = {}) => native.updateOptions(JSON.stringify(options)),
  updateMetadataForTrack: (index: number, metadata: TrackMetadataBase) => native.updateMetadataForTrack(index, serializeMetadata(metadata)),
  clearNowPlayingMetadata: () => native.clearNowPlayingMetadata(),
  updateNowPlayingMetadata: (metadata: NowPlayingMetadata, _playing?: boolean) => native.updateNowPlayingMetadata(serializeMetadata(metadata)),
  updateNowPlayingTitles: (titles: NowPlayingTitles) => native.updateNowPlayingTitles(JSON.stringify(titles)),
  reset: () => native.reset(),
  play: () => native.play(),
  pause: () => native.pause(),
  stop: () => native.stop(),
  seekTo: (seconds: number) => native.seekTo(seconds),
  setVolume: (volume: number) => native.setVolume(volume),
  setRate: (rate: number) => native.setRate(rate),
  async setRepeatMode(mode: RepeatMode) {
    await native.setRepeatMode(mode)
    return mode
  },
  getVolume: () => native.getVolume(),
  getRate: () => native.getRate(),
  async getTrack(index: number): Promise<Track | null> {
    return (await player.getQueue())[index] ?? null
  },
  async getQueue(): Promise<Track[]> {
    return JSON.parse(await native.getQueue()) as Track[]
  },
  async getCurrentTrack(): Promise<number | null> {
    const index = await native.getCurrentTrack()
    return index < 0 ? null : index
  },
  getDuration: () => initialized ? native.getDuration() : Promise.resolve(0),
  getBufferedPosition: () => initialized ? native.getBufferedPosition() : Promise.resolve(0),
  getPosition: () => initialized ? native.getPosition() : Promise.resolve(0),
  getState: async(): Promise<State> => initialized ? native.getState() : State.None,
  getRepeatMode: async(): Promise<RepeatMode> => initialized ? native.getRepeatMode() : RepeatMode.Off,
  isCached: async(_url: string) => false,
  getCacheSize: async() => 0,
  clearCache: async() => {},
}

export default player
