import { persistCombineReducers } from 'redux-persist'
import AsyncStorage from '@react-native-async-storage/async-storage'

import common from './common'
import search from './search'
import count from './count'

const config = {
  key: 'LIFTED_REDUX_STORE',
  storage: AsyncStorage,
}

const appReducer = persistCombineReducers(config, {
  common,
  search,
  count,
})

export default (state, action) => appReducer(state, action)
