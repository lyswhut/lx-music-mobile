import '@/utils/errorHandle'
import { init as initLog } from '@/utils/log'
import { bootLog, getBootLog } from '@/utils/bootLog'
import '@/config/globalData'
import { getFontSize } from '@/utils/data'
import { Alert } from 'react-native'
import { exitApp } from './utils/nativeModules/utils'
import { windowSizeTools } from './utils/windowSizeTools'
import { listenLaunchEvent } from './navigation/regLaunchedEvent'

console.log('starting app...')
listenLaunchEvent()

void Promise.all([getFontSize(), windowSizeTools.init()]).then(async([fontSize]) => {
  global.lx.fontSize = fontSize
  bootLog('Font size setting loaded.')

  let isInited = false
  let handlePushedHomeScreen: () => void | Promise<void>

  const tryGetBootLog = () => {
    try {
      return getBootLog()
    } catch (err) {
      return 'Get boot log failed.'
    }
  }

  const handleInit = async() => {
    if (isInited) return
    void initLog()
    const { default: init } = await import('@/core/init')
    try {
      handlePushedHomeScreen = await init()
    } catch (err: any) {
      Alert.alert('初始化失败 (Init Failed)', `Boot Log:\n${tryGetBootLog()}\n\n${(err.stack ?? err.message) as string}`, [
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
    isInited ||= true
  }
  const { init: initNavigation, navigations } = await import('@/navigation')

  initNavigation(async() => {
    await handleInit()
    if (!isInited) return
    // import('@/utils/nativeModules/cryptoTest')

    await navigations.pushHomeScreen().then(() => {
      void handlePushedHomeScreen()
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
}).catch((err) => {
  Alert.alert('初始化失败 (Init Failed)', `Boot Log:\n\n${(err.stack ?? err.message) as string}`, [
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
