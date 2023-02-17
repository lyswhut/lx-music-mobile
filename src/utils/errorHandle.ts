import { Alert } from 'react-native'
// import { exitApp } from '@/utils/common'
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler'
import { log } from '@/utils/log'

const errorHandler = (e: Error, isFatal: boolean) => {
  if (isFatal) {
    Alert.alert(
      '💥Unexpected error occurred💥',
      `
应用出bug了😭，以下是错误异常信息，请截图（并附上刚才你进行了什么操作）通过企鹅群或者GitHub反馈，现在应用可能会出现异常，若出现异常请尝试强制结束APP后重新启动！

Error:
${isFatal ? 'Fatal:' : ''} ${e.name} ${e.message}
`,
      [{
        text: '关闭 (Close)',
        onPress: () => {
          // exitApp()
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
