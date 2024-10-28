import {
  setLyric,
  play,
  pause,
  setPlaybackRate,
  toggleSendBluetoothLyric,
  onSetBluetoothLyric,
} from '@/utils/nativeModules/lyricBluetooth'
import settingState from '@/store/setting/state'
import playerState from '@/store/player/state'
import { tranditionalize } from '@/utils/simplify-chinese-main'
import { getPosition } from '@/plugins/player'

export const playBluetoothLyric = async(time: number) => {
  const setting = settingState.setting
  await toggleSendBluetoothLyric(setting['player.isSendBluetoothLyric'])
  await play(time)
}
export const pauseBluetoothLyric = pause
export const setBluetoothLyric = setLyric
export const setBluetoothLyricPlaybackRate = setPlaybackRate
export const OnSetBluetoothLyric = onSetBluetoothLyric

