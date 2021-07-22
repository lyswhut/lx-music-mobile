import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import { initSubscriber } from './subscriber'
// import { persistStore, persistReducer } from 'redux-persist'
// import AsyncStorage from '@react-native-async-storage/async-storage'
// import { createSelector } from 'reselect'

import { combinedReducers } from './reducer'

// const persistConfig = {
//   key: 'root',
//   storage: AsyncStorage,
// }

// const persistedReducer = persistReducer(persistConfig, reducer)

const middlewares = [thunkMiddleware]

// let debuggWrapper = data => data


// if (process.env.NODE_ENV === 'development') {
//   const { createLogger } = require('redux-logger')
//   // const { composeWithDevTools } = require('remote-redux-devtools')
//   middlewares.push(createLogger({
//     collapsed: true,
//   }))
//   // debuggWrapper = composeWithDevTools({ realtime: true, port: 8097 })
// }


const initializeStore = () => {
  const store = createStore(combinedReducers, applyMiddleware(...middlewares))
  initSubscriber(store)
  // const persistor = persistStore(store)
  return store
  // return { store, persistor }
}

// const store = createStore(reducer, applyMiddleware(...middlewares))
// initSubscriber(store)

let store

export default () => {
  if (!store) store = initializeStore()
  return store
}
