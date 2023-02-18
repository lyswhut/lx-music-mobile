import '@/utils/errorHandle'
import { init as initLog } from '@/utils/log'
import '@/config/globalData'
import { init as initNavigation, navigations } from '@/navigation'
import { getFontSize } from '@/utils/data'
import { Alert } from 'react-native'
import { exitApp } from './utils/nativeModules/utils'

console.log('starting app...')
let isInited = false
let handlePushedHomeScreen: () => void

const handleInit = async() => {
  if (isInited) return
  void initLog()
  global.lx.fontSize = await getFontSize()
  const { default: init } = await import('@/core/init')
  try {
    handlePushedHomeScreen = await init()
  } catch (err: any) {
    Alert.alert('初始化失败 (Init Failed)', err.stack ?? err.message, [
      {
        text: 'Exit',
        onPress() {
          exitApp()
        },
      },
    ], {
      cancelable: false,
    })
    return
  }
  isInited = true
}

initNavigation(async() => {
  await handleInit()
  if (!isInited) return
  await navigations.pushHomeScreen().then(() => {
    handlePushedHomeScreen()
  }).catch((err: any) => {
    Alert.alert('Error', err.message, [
      {
        text: 'Exit',
        onPress() {
          exitApp()
        },
      },
    ], {
      cancelable: false,
    })
  })
})

