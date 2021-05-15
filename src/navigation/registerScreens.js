// @flow

import React from 'react'
import { Navigation } from 'react-native-navigation'

import {
  Home,
  // Setting,
} from '@/screens'
import { Provider } from '@/store'

import {
  HOME_SCREEN,
  VERSION_MODAL,
  PACT_MODAL,
  // SETTING_SCREEN,
} from './screenNames'
import VersionModal from './components/VersionModal'
import PactModal from './components/PactModal'

function WrappedComponent(Component) {
  return function inject(props) {
    const EnhancedComponent = () => (
      <Provider>
        <Component
          {...props}
        />
      </Provider>
    )

    return <EnhancedComponent />
  }
}

export default () => {
  Navigation.registerComponent(HOME_SCREEN, () => WrappedComponent(Home))
  Navigation.registerComponent(VERSION_MODAL, () => WrappedComponent(VersionModal))
  Navigation.registerComponent(PACT_MODAL, () => WrappedComponent(PactModal))

  console.info('All screens have been registered...')
}
