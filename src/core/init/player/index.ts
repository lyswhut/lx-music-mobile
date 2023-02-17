import initPlayer from './player'
import initPlayInfo from './playInfo'
import initPlayStatus from './playStatus'
import initPlayerEvent from './playerEvent'
import initWatchList from './watchList'
import initPlayProgress from './playProgress'
import initLyric from './lyric'

export default async(setting: LX.AppSetting) => {
  await initPlayer(setting)
  await initPlayInfo(setting)
  initPlayStatus()
  initPlayerEvent()
  initWatchList()
  initPlayProgress()
  await initLyric(setting)
}
