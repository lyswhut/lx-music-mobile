import '@/utils/errorHandle'
// import { init as initLog, log } from '@/utils/log'
import '@/config/globalData'
import { init as initNavigation, navigations } from '@/navigation'
import { getFontSize } from '@/utils/data'
import { Alert } from 'react-native'
import { exitApp } from './utils/nativeModules/utils'

console.log('starting app...')

initNavigation(async() => {
  global.lx.fontSize = await getFontSize()
  const { default: init } = await import('@/core/init')
  let handlePushedHomeScreen: () => void
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
  navigations.pushHomeScreen().then(() => {
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

