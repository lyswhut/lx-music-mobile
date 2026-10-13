import { DeviceEventEmitter, Platform, TurboModuleRegistry, type TurboModule } from 'react-native'
import { getMusicUrl } from '@/core/music'
import { getPlayQuality } from '@/core/music/utils'
import settingState from '@/store/setting/state'

interface DownloadSpec extends TurboModule {
  prepareDirectory: () => Promise<string>
  downloadMusic: (id: string, url: string, name: string) => Promise<string>
  cancelDownload: (id: string) => void
}

export interface DownloadState {
  visible: boolean
  musicInfo?: LX.Music.MusicInfoOnline
  quality: LX.Quality
  status: 'ready' | 'preparing' | 'resolving' | 'downloading' | 'cancelling' | 'completed' | 'cancelled' | 'failed'
  received: number
  total: number
  path: string
  error: string
}

export const isDownloadSupported = (Platform.OS as string) === 'harmony'
const listeners = new Set<() => void>()
let state: DownloadState = { visible: false, quality: '128k', status: 'ready', received: 0, total: 0, path: '', error: '' }
let activeId = ''
let cancelled = false

const nativeModule = () => TurboModuleRegistry.getEnforcing<DownloadSpec>('LXDownload')
const update = (changes: Partial<DownloadState>) => {
  state = { ...state, ...changes }
  for (const listener of listeners) listener()
}

if (isDownloadSupported) {
  DeviceEventEmitter.addListener('lx-download-progress', (event: { id: string, received: number, total: number }) => {
    if (event.id !== activeId || cancelled) return
    update({ received: event.received, total: event.total })
  })
}

export const getDownloadState = () => state
export const subscribeDownload = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export const getDownloadQualities = (musicInfo: LX.Music.MusicInfoOnline): LX.Quality[] => {
  const supported = global.lx.qualityList[musicInfo.source] ?? []
  return supported.filter(quality => quality === '128k' || !!musicInfo.meta._qualitys[quality])
}

export const requestMusicDownload = (musicInfo: LX.Music.MusicInfo) => {
  if (!isDownloadSupported || musicInfo.source === 'local') return
  setTimeout(() => {
    if (activeId) {
      update({ visible: true })
      return
    }
    update({
      visible: true, musicInfo,
      quality: getPlayQuality(settingState.setting['player.playQuality'], musicInfo),
      status: 'ready', received: 0, total: 0, path: '', error: '',
    })
  }, 0)
}

export const closeDownload = () => {
  if (!activeId) update({ visible: false })
}

export const cancelMusicDownload = () => {
  if (!activeId || cancelled) return
  cancelled = true
  update({ status: 'cancelling' })
  nativeModule().cancelDownload(activeId)
}

export const startMusicDownload = async(quality: LX.Quality) => {
  const musicInfo = state.musicInfo
  if (!isDownloadSupported || !musicInfo || activeId) return
  if (!getDownloadQualities(musicInfo).includes(quality)) {
    update({ status: 'failed', error: global.i18n.t('music_download_quality_unavailable') })
    return
  }
  const id = `download-${Date.now()}`
  activeId = id
  cancelled = false
  update({ quality, status: 'preparing', received: 0, total: 0, error: '', path: '' })
  try {
    const directory = await nativeModule().prepareDirectory()
    if (cancelled || !directory) {
      update({ status: 'cancelled' })
      return
    }
    update({ status: 'resolving' })
    const url = await getMusicUrl({ musicInfo, quality, isRefresh: true, allowToggleSource: false })
    if (cancelled) {
      update({ status: 'cancelled' })
      return
    }
    update({ status: 'downloading' })
    const path = await nativeModule().downloadMusic(id, url, `${musicInfo.name} - ${musicInfo.singer} [${quality}]`)
    update({ status: 'completed', path })
  } catch (error: unknown) {
    let message = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : String(error)
    if (!cancelled && state.status === 'resolving') {
      message = message === 'Aborted' || message === 'AbortError'
        ? global.i18n.t('music_download_source_timeout')
        : `${global.i18n.t('music_download_source_failed')}${message ? `：${message}` : ''}`
    }
    update({ status: cancelled ? 'cancelled' : 'failed', error: message })
  } finally {
    if (activeId === id) activeId = ''
  }
}
