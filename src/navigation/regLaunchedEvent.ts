import { Navigation } from 'react-native-navigation'

let launched = false
const handlers: Array<() => void> = []


export const listenLaunchEvent = () => {
  Navigation.events().registerAppLaunchedListener(() => {
    // console.log('Register app launched listener', launched)
    launched = true
    setImmediate(() => {
      for (const handler of handlers) handler()
    })
  })
}

export const onAppLaunched = (handler: () => void) => {
  handlers.push(handler)
  if (launched) {
    setImmediate(() => {
      handler()
    })
  }
}
