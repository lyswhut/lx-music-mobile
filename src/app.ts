import '@/utils/errorHandle'
import { init as initLog } from '@/utils/log'
import { bootLog, getBootLog } from '@/utils/bootLog'
import '@/config/globalData'
import { init as initNavigation, navigations } from '@/navigation'
import { getFontSize } from '@/utils/data'
import { Alert } from 'react-native'
import { exitApp } from './utils/nativeModules/utils'

console.log('starting app...')
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
  global.lx.fontSize = await getFontSize()
  bootLog('Font size setting loaded.')
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

// const createProxy = () => {
//   return new Proxy(function() {}, {
//     get: (_target, prop, receiver) => {
//       let propName = prop.toString()
//       console.log('proxy get', propName)
//       return createProxy()
//     },
//     // eslint-disable-next-line @typescript-eslint/promise-function-async
//     apply: (target, thisArg, argumentsList) => {
//       console.log('proxy apply')
//       return '56'
//     },

//   })
// }
// const proxy = createProxy()
// console.log(proxy.aaa())
