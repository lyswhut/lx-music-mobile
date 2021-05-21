import { Alert } from 'react-native'
import { exitApp } from '@/utils/tools'
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler'
import { log } from '@/utils/log'

const errorHandler = (e, isFatal) => {
  if (isFatal) {
    log.error(e.message)
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
  } else {
    log.error(e.message)
    console.log(e) // So that we can see it in the ADB logs in case of Android if needed
  }
}

if (process.env.NODE_ENV !== 'development') {
  setJSExceptionHandler(errorHandler, true)

  setNativeExceptionHandler((errorString) => {
    log.error(errorString)
    console.error('+++++', errorString, '+++++')
  })
}
