// import musicSdk from '@/utils/musicSdk'
// import commonActions from '@/store/common/action'
import playerState from '@/store/player/state'
import { prefetch } from '@/components/common/ImageBackground'
import { setBgPic } from '@/core/common'

// const handleUpdateSourceNmaes = () => {
//   const prefix = settingState.setting['common.sourceNameType'] == 'real' ? 'source_' : 'source_alias_'
//   const sourceNames: Record<LX.OnlineSource | 'all', string> = {
//     kw: 'kw',
//     tx: 'tx',
//     kg: 'kg',
//     mg: 'mg',
//     wy: 'wy',
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
//     all: global.i18n.t(prefix + 'all' as any),
//   }
//   for (const { id } of musicSdk.sources) {
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
//     sourceNames[id as LX.OnlineSource] = global.i18n.t(prefix + id as any)
//   }
//   commonActions.setSourceNames(sourceNames)
// }
const formatUri = <T extends string | null>(url: T) => {
  return (typeof url == 'string' && url.startsWith('/')) ? `file://${url}` : url
}

export default async(setting: LX.AppSetting) => {
  // const handleConfigUpdated = (keys: Array<keyof LX.AppSetting>, setting: Partial<LX.AppSetting>) => {
  //   // if (keys.includes('common.sourceNameType')) handleUpdateSourceNmaes()
  //   handleConfigUpdate(keys, setting)
  // }

  let pic = playerState.musicInfo.pic
  let isDynamicBg = setting['theme.dynamicBg']
  const handleUpdatePic = (pic: string) => {
    if (!pic) return
    const picUrl = formatUri(pic)
    void prefetch(picUrl).then(() => {
      if (pic != playerState.musicInfo.pic || !isDynamicBg) return
      setBgPic(picUrl)
    })
  }
  const handlePicUpdate = () => {
    if (playerState.musicInfo.pic && playerState.musicInfo.pic != playerState.loadErrorPicUrl) {
      // if (playerState.musicInfo.pic != playerState.loadErrorPicUrl) {
      pic = playerState.musicInfo.pic
      if (!isDynamicBg) return
      handleUpdatePic(pic)
      // .catch(() => {
      //   if (pic != playerState.musicInfo.pic) return
      //   setBgPic(null)
      // })
    }
    // } else {
    //   if (!isDynamicBg) return
    //   setPic(null)
    // }
  }
  const handleConfigUpdate = (keys: Array<keyof LX.AppSetting>, setting: Partial<LX.AppSetting>) => {
    if (!keys.includes('theme.dynamicBg')) return
    isDynamicBg = setting['theme.dynamicBg']!
    if (isDynamicBg) {
      if (pic) handleUpdatePic(pic)
    } else setBgPic(null)
  }
  handlePicUpdate()
  global.state_event.on('playerMusicInfoChanged', handlePicUpdate)
  global.state_event.on('configUpdated', handleConfigUpdate)
}
