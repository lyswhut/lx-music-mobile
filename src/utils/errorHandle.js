import { Alert } from 'react-native'
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler'
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
      }],
    )
  } else {
    console.log(e) // So that we can see it in the ADB logs in case of Android if needed
  }
}

setJSExceptionHandler(errorHandler, true)

setNativeExceptionHandler((errorString) => {
  console.error('+++++', errorString, '+++++')
})
