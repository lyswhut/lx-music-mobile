import { init as initLyricPlayer, toggleTranslation, toggleRoma, play, pause, stop, setLyric, setPlaybackRate } from '@/core/lyric'
import { updateSetting } from '@/core/common'
import { onDesktopLyricPositionChange, showDesktopLyric } from '@/core/desktopLyric'
import { OnSetBluetoothLyric } from '@/core/bluetoothLyric'
import TrackPlayer, { State } from 'react-native-track-player'
import { toast } from '@/utils/tools'

export default async(setting: LX.AppSetting) => {
  await initLyricPlayer()
  void setPlaybackRate(setting['player.playbackRate'])
  void toggleTranslation(setting['player.isShowLyricTranslation'])
  void toggleRoma(setting['player.isShowLyricRoma'])

  if (setting['desktopLyric.enable']) {
    showDesktopLyric().catch(() => {
      updateSetting({ 'desktopLyric.enable': false })
    })
  }
  onDesktopLyricPositionChange(position => {
    updateSetting({
      'desktopLyric.position.x': position.x,
      'desktopLyric.position.y': position.y,
    })
  })

  OnSetBluetoothLyric(async lyric => {
    let isPlaying = await TrackPlayer.getState() == State.Playing
    if (isPlaying) {
      let etime = await TrackPlayer.getPosition()
      let duration = await TrackPlayer.getDuration()
      await TrackPlayer.clearNowPlayingMetadata()
      await TrackPlayer.updateNowPlayingMetadata({
        title: lyric.title,
        artist: lyric.singer,
        album: lyric.album,
        duration: duration,
        elapsedTime: etime
      }, isPlaying)
    }
  })

  global.app_event.on('play', play)
  global.app_event.on('pause', pause)
  global.app_event.on('stop', stop)
  global.app_event.on('error', pause)
  global.app_event.on('musicToggled', stop)
  global.app_event.on('lyricUpdated', setLyric)
}
