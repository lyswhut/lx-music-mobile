import { init as initLyricPlayer, toggleTranslation, toggleRoma, play, pause, stop, setLyric, setPlaybackRate } from '@/core/lyric'
import { updateSetting } from '@/core/common'
import { onDesktopLyricPositionChange, showDesktopLyric } from '@/core/desktopLyric'

export default async(setting: LX.AppSetting) => {
  await initLyricPlayer()
  void setPlaybackRate(setting['player.playbackRate'])
  toggleTranslation(setting['player.isShowLyricTranslation'])
  toggleRoma(setting['player.isShowLyricRoma'])

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


  global.app_event.on('play', play)
  global.app_event.on('pause', pause)
  global.app_event.on('stop', stop)
  global.app_event.on('error', pause)
  global.app_event.on('musicToggled', stop)
  global.app_event.on('lyricUpdated', setLyric)
}
