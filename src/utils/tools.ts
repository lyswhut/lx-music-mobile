import { Platform, ToastAndroid, BackHandler, Linking, Dimensions, Alert, Appearance, PermissionsAndroid, AppState, StyleSheet, type ScaledSize } from 'react-native'
// import ExtraDimensions from 'react-native-extra-dimensions-android'
import Clipboard from '@react-native-clipboard/clipboard'
import { storageDataPrefix } from '@/config/constant'
import { gzip, ungzip } from '@/utils/nativeModules/gzip'
import { temporaryDirectoryPath, unlink } from '@/utils/fs'
import { getSystemLocales, isNotificationsEnabled, openNotificationPermissionActivity, readFile, shareText, writeFile } from '@/utils/nativeModules/utils'
import musicSdk from '@/utils/musicSdk'
import { getData, removeData, saveData } from '@/plugins/storage'
import BackgroundTimer from 'react-native-background-timer'
import { scaleSizeH, scaleSizeW, setSpText } from './pixelRatio'
import { toOldMusicInfo } from './index'
import { stringMd5 } from 'react-native-quick-md5'

// https://stackoverflow.com/a/47349998
export const getDeviceLanguage = async() => {
  // let deviceLanguage = Platform.OS === 'ios'
  //   ? NativeModules.SettingsManager.settings.AppleLocale ||
  //     NativeModules.SettingsManager.settings.AppleLanguages[0] // iOS 13
  //   : await getSystemLocales()
  // deviceLanguage = typeof deviceLanguage === 'string' ? deviceLanguage.substring(0, 5).toLocaleLowerCase() : ''
  return await getSystemLocales()
}


export const isAndroid = Platform.OS === 'android'
// @ts-expect-error
export const osVer = Platform.constants.Release as string

export const isActive = () => AppState.currentState == 'active'


// fix https://github.com/facebook/react-native/issues/4934
export const getWindowSise = (windowDimensions?: ReturnType<(typeof Dimensions)['get']>) => {
  windowDimensions ??= Dimensions.get('window')
  // if (Platform.OS === 'ios') return windowDimensions
  return windowDimensions
  // const windowSize = {
  //   width: ExtraDimensions.getRealWindowWidth(),
  //   height: ExtraDimensions.getRealWindowHeight(),
  // }
  // if (
  //   (windowDimensions.height > windowDimensions.width && windowSize.height < windowSize.width) ||
  //   (windowDimensions.width > windowDimensions.height && windowSize.width < windowSize.height)
  // ) {
  //   windowSize.height = windowSize.width
  // }
  // windowSize.width = windowDimensions.width

  // if (ExtraDimensions.isSoftMenuBarEnabled()) {
  //   windowSize.height -= ExtraDimensions.getSoftMenuBarHeight()
  // }
  // return windowSize
}

export const checkStoragePermissions = async() => PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE)

export const requestStoragePermission = async() => {
  const isGranted = await checkStoragePermissions()
  if (isGranted) return isGranted

  try {
    const granted = await PermissionsAndroid.requestMultiple(
      [
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ],
      // {
      //   title: '存储读写权限申请',
      //   message:
      //     '洛雪音乐助手需要使用存储读写权限才能下载歌曲.',
      //   buttonNeutral: '一会再问我',
      //   buttonNegative: '取消',
      //   buttonPositive: '确定',
      // },
    )
    // console.log(granted)
    // console.log(Object.values(granted).every(r => r === PermissionsAndroid.RESULTS.GRANTED))
    // console.log(PermissionsAndroid.RESULTS)
    const granteds = Object.values(granted)
    return granteds.every(r => r === PermissionsAndroid.RESULTS.GRANTED)
      ? true
      : granteds.includes(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)
        ? null
        : false
    // if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    //   console.log('You can use the storage')
    // } else {
    //   console.log('Storage permission denied')
    // }
  } catch (err: any) {
    // console.warn(err)
    return false
  }
}


/**
 * 显示toast
 * @param message 消息
 * @param duration 时长
 * @param position 位置
 */
export const toast = (message: string, duration: 'long' | 'short' = 'short', position: 'top' | 'center' | 'bottom' = 'bottom') => {
  let _duration
  switch (duration) {
    case 'long':
      _duration = ToastAndroid.LONG
      break
    case 'short':
    default:
      _duration = ToastAndroid.SHORT
      break
  }
  let _position
  switch (position) {
    case 'top':
      _position = ToastAndroid.TOP
      break
    case 'center':
      _position = ToastAndroid.CENTER
      break
    case 'bottom':
    default:
      _position = ToastAndroid.BOTTOM
      break
  }
  ToastAndroid.showWithGravity(message, _duration, _position)
}

export const openUrl = async(url: string): Promise<void> => Linking.canOpenURL(url).then(async() => Linking.openURL(url))

export const assertApiSupport = (source: LX.Source): boolean => {
  return source == 'local' || global.lx.qualityList[source] != null
}

// const handleRemoveDataMultiple = async keys => {
//   await removeDataMultiple(keys.splice(0, 500))
//   if (keys.length) return handleRemoveDataMultiple(keys)
// }

export const exitApp = BackHandler.exitApp

export const handleSaveFile = async(path: string, data: any) => {
  // if (!path.endsWith('.json')) path += '.json'
  // const buffer = gzip(data)
  const tempFilePath = `${temporaryDirectoryPath}/tempFile.json`
  await writeFile(tempFilePath, JSON.stringify(data))
  await gzip(tempFilePath, path)
  await unlink(tempFilePath)
}
export const handleReadFile = async<T = unknown>(path: string): Promise<T> => {
  let isJSON = path.endsWith('.json')
  let data
  if (isJSON) {
    data = await readFile(path)
  } else {
    const tempFilePath = `${temporaryDirectoryPath}/tempFile.json`
    await ungzip(path, tempFilePath)
    data = await readFile(tempFilePath)
    await unlink(tempFilePath)
  }
  return JSON.parse(data)
}

export const confirmDialog = async({
  message = '',
  cancelButtonText = global.i18n.t('dialog_cancel'),
  confirmButtonText = global.i18n.t('dialog_confirm'),
  bgClose = true,
}) => {
  return new Promise(resolve => {
    Alert.alert('', message, [
      {
        text: cancelButtonText,
        onPress() {
          resolve(false)
        },
      },
      {
        text: confirmButtonText,
        onPress() {
          resolve(true)
        },
      },
    ], {
      cancelable: bgClose,
      onDismiss() {
        resolve(false)
      },
    })
  })
}

export const clipboardWriteText = (str: string) => {
  Clipboard.setString(str)
}


export const checkNotificationPermission = async() => {
  const isHide = await getData(storageDataPrefix.notificationTipEnable)
  if (isHide != null) return
  const enabled = await isNotificationsEnabled()
  if (enabled) return
  Alert.alert(
    global.i18n.t('notifications_check_title'),
    global.i18n.t('notifications_check_tip'),
    [
      {
        text: global.i18n.t('never_show'),
        onPress: () => {
          void saveData(storageDataPrefix.notificationTipEnable, '1')
          toast(global.i18n.t('disagree_tip'))
        },
      },
      {
        text: global.i18n.t('disagree'),
        onPress: () => {
          toast(global.i18n.t('disagree_tip'))
        },
      },
      {
        text: global.i18n.t('agree_go'),
        onPress: () => {
          void openNotificationPermissionActivity()
        },
      },
    ],
  )
}
export const resetNotificationPermissionCheck = async() => {
  return removeData(storageDataPrefix.notificationTipEnable)
}

export const shareMusic = (shareType: LX.ShareType, downloadFileName: LX.AppSetting['download.fileName'], musicInfo: LX.Music.MusicInfo) => {
  const name = musicInfo.name
  const singer = musicInfo.singer
  const detailUrl = musicInfo.source == 'local' ? '' : musicSdk[musicInfo.source]?.getMusicDetailPageUrl(toOldMusicInfo(musicInfo)) ?? ''
  const musicTitle = downloadFileName.replace('歌名', name).replace('歌手', singer)
  switch (shareType) {
    case 'system':
      void shareText(global.i18n.t('share_card_title_music', { name }), global.i18n.t('share_title_music'), `${musicTitle.replace(/\s/g, '')}${detailUrl ? '\n' + detailUrl : ''}`)
      break
    case 'clipboard':
      clipboardWriteText(`${musicTitle}${detailUrl ? '\n' + detailUrl : ''}`)
      toast(global.i18n.t('copy_name_tip'))
      break
  }
}

export const onDimensionChange = (handler: (info: { window: ScaledSize, screen: ScaledSize }) => void) => {
  return Dimensions.addEventListener('change', handler)
}


export const getAppearance = () => {
  return Appearance.getColorScheme() ?? 'light'
}

export const onAppearanceChange = (callback: (colorScheme: Parameters<Parameters<typeof Appearance['addChangeListener']>[0]>[0]['colorScheme']) => void) => {
  return Appearance.addChangeListener(({ colorScheme }) => {
    callback(colorScheme)
  })
}

let isSupportedAutoTheme: boolean | null = null
export const getIsSupportedAutoTheme = () => {
  if (isSupportedAutoTheme == null) {
    const osVerNum = parseInt(osVer)
    isSupportedAutoTheme = isAndroid
      ? osVerNum >= 10
      : osVerNum >= 13
  }
  return isSupportedAutoTheme
}


export const showImportTip = (type: string) => {
  let message
  switch (type) {
    case 'defautlList':
    case 'playList':
    case 'playList_v2':
      message = global.i18n.t('list_import_tip__playlist')
      break
    case 'setting':
    case 'setting_v2':
      message = global.i18n.t('list_import_tip__setting')
      break
    case 'allData':
    case 'allData_v2':
      message = global.i18n.t('list_import_tip__alldata')
      break
    case 'playListPart':
    case 'playListPart_v2':
      message = global.i18n.t('list_import_tip__playlist_part')
      break

    default:
      message = global.i18n.t('list_import_tip__unknown')
      break
  }
  Alert.alert(
    global.i18n.t('list_import_tip__failed'),
    message,
    [
      {
        text: global.i18n.t('ok'),
      },
    ],
  )
}


/**
 * 生成节流函数
 * @param fn 回调
 * @param delay 延迟
 * @returns
 */
export function throttleBackgroundTimer<Args extends any[]>(fn: (...args: Args) => void | Promise<void>, delay = 100) {
  let timer: number | null = null
  let _args: Args
  return (...args: Args) => {
    _args = args
    if (timer) return
    timer = BackgroundTimer.setTimeout(() => {
      timer = null
      void fn(..._args)
    }, delay)
  }
}

/**
 * 生成防抖函数
 * @param fn 回调
 * @param delay 延迟
 * @returns
 */
export function debounceBackgroundTimer<Args extends any[]>(fn: (...args: Args) => void | Promise<void>, delay = 100) {
  let timer: number | null = null
  let _args: Args
  return (...args: Args) => {
    _args = args
    if (timer) BackgroundTimer.clearTimeout(timer)
    timer = BackgroundTimer.setTimeout(() => {
      timer = null
      void fn(..._args)
    }, delay)
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
type Styles = StyleSheet.NamedStyles<Record<string, {}>>
type Style = Styles[keyof Styles]
const trasformeProps: Array<keyof Style> = [
  // @ts-expect-error
  'fontSize',
  // @ts-expect-error
  'lineHeight',
  // 'margin',
  // 'marginLeft',
  // 'marginRight',
  // 'marginTop',
  // 'marginBottom',
  // 'padding',
  // 'paddingLeft',
  // 'paddingRight',
  // 'paddingTop',
  // 'paddingBottom',
  'left',
  'right',
  'top',
  'bottom',
]
export const trasformeStyle = <T extends Style>(styles: T): T => {
  const newStyle: T = { ...styles }

  for (const [p, v] of Object.entries(newStyle) as Array<[keyof Style, Style[keyof Style]]>) {
    if (typeof v != 'number') continue
    switch (p) {
      case 'height':
      case 'minHeight':
      case 'marginTop':
      case 'marginBottom':
      case 'paddingTop':
      case 'paddingBottom':
      case 'paddingVertical':
        newStyle[p] = scaleSizeH(v)
        break
      case 'width':
      case 'minWidth':
      case 'marginLeft':
      case 'marginRight':
      case 'paddingLeft':
      case 'paddingRight':
      case 'paddingHorizontal':
      case 'gap':
        newStyle[p] = scaleSizeW(v)
        break
      case 'padding':
        newStyle.paddingRight = newStyle.paddingLeft = scaleSizeW(v)
        newStyle.paddingBottom = newStyle.paddingTop = scaleSizeH(v)
        break
      case 'margin':
        newStyle.marginRight = newStyle.marginLeft = scaleSizeW(v)
        newStyle.marginBottom = newStyle.marginTop = scaleSizeH(v)
        break
      default:
        // @ts-expect-error
        if (trasformeProps.includes(p)) newStyle[p] = setSpText(v)
        break
    }
  }
  return newStyle
}

export const createStyle = <T extends StyleSheet.NamedStyles<T>>(styles: T | StyleSheet.NamedStyles<T>): T => {
  const newStyle: Record<string, Style> = { ...styles }
  for (const [n, s] of Object.entries(newStyle)) {
    newStyle[n] = trasformeStyle(s)
  }
  return StyleSheet.create(newStyle as StyleSheet.NamedStyles<T>)
}

export const toMD5 = stringMd5
