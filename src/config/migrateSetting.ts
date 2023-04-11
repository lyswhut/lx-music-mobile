import { compareVer } from '@/utils'

export default (setting: any): Partial<LX.AppSetting> => {
  setting = { ...setting }

  // 迁移 v1 之前的配置
  if (compareVer(setting.version, '2.0') < 0) {
    setting['player.startupAutoPlay'] = setting.startupAutoPlay
    setting['player.togglePlayMethod'] = setting.player?.togglePlayMethod
    setting['player.isPlayHighQuality'] = setting.player?.highQuality
    setting['player.isSavePlayTime'] = setting.player?.isSavePlayTime
    setting['player.cacheSize'] = setting.player?.cacheSize
    setting['player.timeoutExit'] = setting.player?.timeoutExit
    setting['player.timeoutExitPlayed'] = setting.player?.timeoutExitPlayed
    setting['player.isHandleAudioFocus'] = setting.player?.isHandleAudioFocus
    setting['player.isShowLyricTranslation'] = setting.player?.isShowLyricTranslation
    setting['player.isShowLyricRoma'] = setting.player?.isShowLyricRoma
    setting['player.isShowNotificationImage'] = setting.player?.isShowNotificationImage
    setting['player.isS2t'] = setting.player?.isS2t
    setting['playDetail.portrait.style.lrcFontSize'] = setting.player?.portrait?.style?.lrcFontSize
    setting['playDetail.landscape.style.lrcFontSize'] = setting.player?.landscape?.style?.lrcFontSize
    setting['desktopLyric.enable'] = setting.desktopLyric?.enable
    setting['desktopLyric.isLock'] = setting.desktopLyric?.isLock
    setting['desktopLyric.width'] = setting.desktopLyric?.width
    setting['desktopLyric.maxLineNum'] = setting.desktopLyric?.maxLineNum
    setting['desktopLyric.isSingleLine'] = setting.desktopLyric?.isSingleLine
    setting['desktopLyric.showToggleAnima'] = setting.desktopLyric?.showToggleAnima
    setting['desktopLyric.position.x'] = setting.desktopLyric?.position?.x
    setting['desktopLyric.position.y'] = setting.desktopLyric?.position?.y
    setting['desktopLyric.textPosition.x'] = setting.desktopLyric?.textPosition?.x
    setting['desktopLyric.textPosition.y'] = setting.desktopLyric?.textPosition?.y
    setting['desktopLyric.style.fontSize'] = setting.desktopLyric?.style?.fontSize
    setting['desktopLyric.style.opacity'] = setting.desktopLyric?.style?.opacity
    setting['list.isClickPlayList'] = setting.list?.isClickPlayList
    setting['list.isShowSource'] = setting.list?.isShowSource
    setting['list.isSaveScrollLocation'] = setting.list?.isSaveScrollLocation
    setting['list.addMusicLocationType'] = setting.list?.addMusicLocationType
    setting['common.themeId'] = setting.themeId
    setting['common.isAutoTheme'] = setting.isAutoTheme
    setting['common.langId'] = setting.langId
    setting['common.apiSource'] = setting.apiSource
    setting['common.sourceNameType'] = setting.sourceNameType
    setting['common.shareType'] = setting.shareType
    setting['common.isAgreePact'] = setting.isAgreePact
    setting['sync.enable'] = setting.sync?.enable
    setting['theme.id'] = setting.themeId
  }

  return setting
}
