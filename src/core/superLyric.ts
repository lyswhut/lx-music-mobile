import { Platform } from 'react-native'

import playerState from '@/store/player/state'
import settingState from '@/store/setting/state'
import {
  clear as clearNative,
  isAvailable,
  setEnabled as setEnabledNative,
  setLyric as setLyricNative,
} from '@/utils/nativeModules/superLyric'

export const isSupported = Platform.OS === 'android' && Number(Platform.Version) >= 26

const publish = async() => {
  const { id, name, singer, album, lrc, tlrc, rlrc } = playerState.musicInfo
  if (!lrc || !id || !name) return
  await setLyricNative(lrc, tlrc ?? '', rlrc ?? '', {
    id,
    title: name,
    artist: singer ?? '',
    album: album ?? '',
    duration: Math.round(playerState.progress.maxPlayTime * 1000),
  })
}

export const checkSuperLyricAvailable = async(): Promise<boolean> => {
  if (!isSupported) return false
  return isAvailable()
}

export const setSuperLyricEnabled = async(enabled: boolean): Promise<boolean> => {
  if (!isSupported) return false
  const available = await setEnabledNative(enabled)
  if (enabled) await publish()
  return available
}

export const setSuperLyric = async(lyric: string, translation: string, romaLyric: string): Promise<void> => {
  if (!isSupported || !settingState.setting['player.isShowSuperLyric']) return
  const { id, name, singer, album } = playerState.musicInfo
  if (!lyric || !id || !name) return
  await setLyricNative(lyric, translation, romaLyric, {
    id,
    title: name,
    artist: singer ?? '',
    album: album ?? '',
    duration: Math.round(playerState.progress.maxPlayTime * 1000),
  })
}

export const clearSuperLyric = async(): Promise<void> => {
  if (!isSupported || !settingState.setting['player.isShowSuperLyric']) return
  await clearNative()
}
