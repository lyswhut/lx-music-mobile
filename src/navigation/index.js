import { Navigation } from 'react-native-navigation'
import * as screenNames from './screenNames'
import * as navigations from './navigation'

import registerScreens from './registerScreens'

// let unRegisterEvent

const init = callback => {
  // Register all screens on launch
  registerScreens()

  // if (unRegisterEvent) unRegisterEvent()

  Navigation.setDefaultOptions({
    animations: {
      setRoot: {
        waitForRender: true,
      },
    },
  })
  // unRegisterEvent = Navigation.events().registerCommandListener((name, params) => {
  //   console.log(name, params)
  // })
  Navigation.events().registerAppLaunchedListener(() => {
    console.log('Register app launched listener')
    callback()
  })
}

export * from './utils'

export {
  init,
  screenNames,
  navigations,
}
