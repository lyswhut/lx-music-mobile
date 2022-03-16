import { NativeModules } from 'react-native'

const { UtilsModule } = NativeModules

export const exitApp = UtilsModule.exitApp

export const getSupportedAbis = UtilsModule.getSupportedAbis

export const installApk = (filePath, fileProviderAuthority) => UtilsModule.installApk(filePath, fileProviderAuthority)


export const screenkeepAwake = () => {
  if (global.isScreenKeepAwake) return
  global.isScreenKeepAwake = true
  UtilsModule.screenkeepAwake()
}
export const screenUnkeepAwake = () => {
  // console.log('screenUnkeepAwake')
  if (!global.isScreenKeepAwake) return
  global.isScreenKeepAwake = false
  UtilsModule.screenUnkeepAwake()
}

export const getWIFIIPV4Address = UtilsModule.getWIFIIPV4Address

export const getDeviceName = () => {
  return UtilsModule.getDeviceName().then(deviceName => deviceName || 'Unknown')
}

export const isNotificationsEnabled = UtilsModule.isNotificationsEnabled

export const openNotificationPermissionActivity = UtilsModule.openNotificationPermissionActivity
