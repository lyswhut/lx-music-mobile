import { Alert } from 'react-native'
import { exitApp } from '@/utils/common'
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler'
import { log } from '@/utils/log'

const errorHandler = (e, isFatal) => {
  if (isFatal) {
    Alert.alert(
      '💥Unexpected error occurred💥',
      `
应用出bug了😭，已崩溃💥，以下是错误异常信息，请截图通过企鹅群或者GitHub反馈，现在应用将会关闭，请自行重新启动！

Error:
${isFatal ? 'Fatal:' : ''} ${e.name} ${e.message}
`,
      [{
        text: '关闭 (Close)',
        onPress: () => {
          exitApp()
        },
      }],
    )
  }
  log.error(e.stack)
}

if (process.env.NODE_ENV !== 'development') {
  setJSExceptionHandler(errorHandler)

  setNativeExceptionHandler((errorString) => {
    log.error(errorString)
    console.log('+++++', errorString, '+++++')
  }, false)
}
