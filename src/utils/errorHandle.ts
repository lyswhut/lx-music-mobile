import { Alert } from 'react-native'
// import { exitApp } from '@/utils/common'
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler'
import { log } from '@/utils/log'

const errorHandler = (e: Error, isFatal: boolean) => {
  const excludedErrors = [
    'RangeError Failed to construct \'Response\'',
  ]
  if (isFatal && !excludedErrors.includes(e.message)) {
    Alert.alert(
      '💥Unexpected error occurred💥',
      `
应用出 bug 了😭，以下是错误异常信息。请截图并在 GitHub 反馈（并附上刚才你进行了什么操作，以及附上“设置-错误日志”的内容）。现在应用可能会出现异常，若出现异常请尝试强制结束应用后重新启动！

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
