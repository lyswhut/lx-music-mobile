// import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource'
import defaultUrl from '@/resources/medias/Silence02s.mp3'
import notificationIcon from '@/resources/images/notification.xhdpi.png'
// const defaultUrl = resolveAssetSource(resourceDefaultUrl).uri

export {
  defaultUrl,
  notificationIcon,
}
// export const defaultUrl = require('@/resources/medias/Silence02s.mp3')

export const storageDataPrefix = {
  setting: '@setting',
  list: '@list__',
  listPosition: '@listposition__',
  listSort: '@listsort__',
  lyric: '@lyric__',
  musicUrl: '@music_url__',
  playInfo: '@play_info',
  syncAuthKey: '@sync_auth_key',
  syncHost: '@sync_host',
  syncHostHistory: '@sync_host_history',
  notificationTipEnable: '@notification_tip_enable',
}
