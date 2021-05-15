// import { persistCombineReducers } from 'redux-persist'
// import AsyncStorage from '@react-native-async-storage/async-storage'
import { combineReducers } from 'redux'

import * as modules from './modules'

// const config = {
//   key: 'LIFTED_REDUX_STORE',
//   storage: AsyncStorage,
// }

const reducers = {}


for (const [moduleName, { reducer }] of Object.entries(modules)) {
  reducers[moduleName] = reducer
}

const combinedReducers = combineReducers(reducers)

// const appReducer = persistCombineReducers(config, reducers)

export {
  reducers,
  combinedReducers,
}
// export default (state, action) => appReducer(state, action)
