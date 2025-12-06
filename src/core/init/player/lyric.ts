import { init as initLyricPlayer, toggleTranslation, toggleRoma, play, pause, stop, setLyric, setPlaybackRate } from '@/core/lyric'
import { updateSetting } from '@/core/common'
import { onDesktopLyricPositionChange, showDesktopLyric, onLyricLinePlay, showRemoteLyric } from '@/core/desktopLyric'
import playerState from '@/store/player/state'
import { updateNowPlayingTitles } from '@/plugins/player/utils'
import { setLastLyric } from '@/core/player/playInfo'
import { state } from '@/plugins/player/playList'

const updateRemoteLyric = async (lrc?: string) => {
  setLastLyric(lrc)
  if (lrc == null) {
    void updateNowPlayingTitles((state.prevDuration || 0) * 1000, playerState.musicInfo.name, playerState.musicInfo.singer ?? '', playerState.musicInfo.album ?? '')
  } else {
    void updateNowPlayingTitles((state.prevDuration || 0) * 1000, lrc, `${playerState.musicInfo.name}${playerState.musicInfo.singer ? ` - ${playerState.musicInfo.singer}` : ''}`, playerState.musicInfo.album ?? '')
  }
}

export default async (setting: LX.AppSetting) => {
  await initLyricPlayer()
  await Promise.all([
    setPlaybackRate(setting['player.playbackRate']),
    toggleTranslation(setting['player.isShowLyricTranslation']),
    toggleRoma(setting['player.isShowLyricRoma']),
  ])

  if (setting['desktopLyric.enable']) {
    showDesktopLyric().catch(() => {
      updateSetting({ 'desktopLyric.enable': false })
    })
  }
  if (setting['player.isShowBluetoothLyric']) {
    showRemoteLyric(true).catch(() => {
      updateSetting({ 'player.isShowBluetoothLyric': false })
    })
  }
  onDesktopLyricPositionChange(position => {
    updateSetting({
      'desktopLyric.position.x': position.x,
      'desktopLyric.position.y': position.y,
    })
  })

  // 唯一修改：替换onLyricLinePlay回调，实现目标效果
  onLyricLinePlay(({ text, index, lines }) => {
    if (!text && !state.isPlaying) {
      void updateRemoteLyric()
    } else {
      const lyricLines: string[] = []
      const totalLines = lines?.length || 0

      // 首句：当前句在最上方，显示“当前句+下1句+下2句”
      if (index === 0) {
        lyricLines.push(text)
        if (totalLines > 1) lyricLines.push(lines![1].text)
        if (totalLines > 2) lyricLines.push(lines![2].text)
      }
      // 尾句：当前句在最下方，显示“上2句+上1句+当前句”
      else if (index === totalLines - 1) {
        if (totalLines > 2) lyricLines.push(lines![index - 2].text)
        if (totalLines > 1) lyricLines.push(lines![index - 1].text)
        lyricLines.push(text)
      }
      // 中间句：当前句在中间，显示“上1句+当前句+下1句”
      else {
        lyricLines.push(lines![index - 1].text)
        lyricLines.push(text)
        lyricLines.push(lines![index + 1].text)
      }

      // 拼接为3行文本，适配投屏
      const multiLineLyric = lyricLines.join('\n')
      void updateRemoteLyric(multiLineLyric)
    }
  })

  global.app_event.on('play', play)
  global.app_event.on('pause', pause)
  global.app_event.on('stop', stop)
  global.app_event.on('error', pause)
  global.app_event.on('musicToggled', stop)
  global.app_event.on('lyricUpdated', setLyric)
}
