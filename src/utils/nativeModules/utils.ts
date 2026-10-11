import { AppState, DeviceEventEmitter, NativeEventEmitter, NativeModules, Platform, TurboModuleRegistry, type TurboModule } from 'react-native'

interface UtilsSpec extends TurboModule {
  addListener: (eventName: string) => void
  removeListeners: (count: number) => void
  exitApp: () => void
  getSupportedAbis: () => Promise<string[]>
  installApk: (filePath: string, fileProviderAuthority: string) => Promise<void>
  screenkeepAwake: () => void
  screenUnkeepAwake: () => void
  getWIFIIPV4Address: () => Promise<string>
  getDeviceName: () => Promise<string>
  isNotificationsEnabled: () => Promise<boolean>
  openNotificationPermissionActivity: () => Promise<boolean>
  shareText: (shareTitle: string, title: string, text: string) => Promise<void>
  getSystemLocales: () => Promise<string>
  getWindowSize: () => Promise<{ width: number, height: number }>
  listenWindowSizeChanged: () => void
  isIgnoringBatteryOptimization: () => Promise<boolean>
  requestIgnoreBatteryOptimization: () => Promise<boolean>
  removeListener: (eventName: string) => void
}

const isHarmony = (Platform.OS as string) === 'harmony'
const UtilsModule = (isHarmony
  ? TurboModuleRegistry.getEnforcing<UtilsSpec>('UtilsModule')
  : NativeModules.UtilsModule) as UtilsSpec

export const exitApp = UtilsModule.exitApp

export const getSupportedAbis = UtilsModule.getSupportedAbis

export const installApk = (filePath: string, fileProviderAuthority: string) => UtilsModule.installApk(filePath, fileProviderAuthority)


export const screenkeepAwake = () => {
  if (global.lx.isScreenKeepAwake) return
  global.lx.isScreenKeepAwake = true
  UtilsModule.screenkeepAwake()
}
export const screenUnkeepAwake = () => {
  // console.log('screenUnkeepAwake')
  if (!global.lx.isScreenKeepAwake) return
  global.lx.isScreenKeepAwake = false
  UtilsModule.screenUnkeepAwake()
}

export const getWIFIIPV4Address = UtilsModule.getWIFIIPV4Address as () => Promise<string>

export const getDeviceName = async(): Promise<string> => {
  return UtilsModule.getDeviceName().then((deviceName: string) => deviceName || 'Unknown')
}

export const isNotificationsEnabled = UtilsModule.isNotificationsEnabled as () => Promise<boolean>

export const requestNotificationPermission = async() => {
  if (isHarmony) return UtilsModule.openNotificationPermissionActivity()
  return new Promise<boolean>((resolve) => {
    let subscription = AppState.addEventListener('change', (state) => {
      if (state != 'active') return
      subscription.remove()
      setTimeout(() => {
        void isNotificationsEnabled().then(resolve)
      }, 1000)
    })
    UtilsModule.openNotificationPermissionActivity().then((result: boolean) => {
      if (result) return
      subscription.remove()
      resolve(false)
    })
  })
}

export const shareText = async(shareTitle: string, title: string, text: string): Promise<void> => {
  await UtilsModule.shareText(shareTitle, title, text)
}

export const getSystemLocales = async(): Promise<string> => {
  return UtilsModule.getSystemLocales()
}

export const onScreenStateChange = (handler: (state: 'ON' | 'OFF') => void): () => void => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const eventEmitter = isHarmony ? DeviceEventEmitter : new NativeEventEmitter(UtilsModule)
  const eventListener = eventEmitter.addListener('screen-state', event => {
    handler(event.state as 'ON' | 'OFF')
  })
  if (isHarmony) UtilsModule.addListener('screen-state')

  let removed = false
  return () => {
    if (removed) return
    removed = true
    eventListener.remove()
    if (isHarmony) UtilsModule.removeListener('screen-state')
  }
}

export const getWindowSize = async(): Promise<{ width: number, height: number }> => {
  return UtilsModule.getWindowSize()
}

export const onWindowSizeChange = (handler: (size: { width: number, height: number }) => void): () => void => {
  UtilsModule.listenWindowSizeChanged()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const eventEmitter = isHarmony ? DeviceEventEmitter : new NativeEventEmitter(UtilsModule)
  const eventListener = eventEmitter.addListener('screen-size-changed', event => {
    handler(event as { width: number, height: number })
  })
  if (isHarmony) UtilsModule.addListener('screen-size-changed')

  let removed = false
  return () => {
    if (removed) return
    removed = true
    eventListener.remove()
    if (isHarmony) UtilsModule.removeListener('screen-size-changed')
  }
}

export const isIgnoringBatteryOptimization = async(): Promise<boolean> => {
  return UtilsModule.isIgnoringBatteryOptimization()
}

export const requestIgnoreBatteryOptimization = async() => {
  if (isHarmony) return UtilsModule.requestIgnoreBatteryOptimization()
  return new Promise<boolean>((resolve) => {
    let subscription = AppState.addEventListener('change', (state) => {
      if (state != 'active') return
      subscription.remove()
      setTimeout(() => {
        void isIgnoringBatteryOptimization().then(resolve)
      }, 1000)
    })
    UtilsModule.requestIgnoreBatteryOptimization().then((result: boolean) => {
      if (result) return
      subscription.remove()
      resolve(false)
    })
  })
}
