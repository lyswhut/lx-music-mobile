/**
 * react-navigation 根组件(替代 Wix RNN 的多 root 机制)。
 *
 * 一个 NavigationContainer + native-stack:4 个页面 + 3 个 overlay(transparentModal)。
 * - componentId 通过 wrap 注入为 route.key,route.params 展开为 props(与 RNN 行为对齐)。
 * - Provider 从「每屏包裹」上移为「整树包裹一次」。
 * - 渲染时序:等待核心 init 完成(appReadyPromise,由 pushHomeScreen→markAppReady 触发)
 *   后再渲染导航树,保证首页在 init 之后挂载(与原 RNN setRoot 时序一致)。
 * - 路由出栈时清理 componentIds(替代 RNN 的 registerScreenPoppedListener)。
 */
import React, { useEffect, useRef, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { Home, PlayDetail, SonglistDetail, Comment } from '@/screens'
import VersionModal from './components/VersionModal'
import PactModal from './components/PactModal'
import SyncModeModal from './components/SyncModeModal'
import { Provider } from '@/store/Provider'
import { navigationRef, appReadyPromise } from './navigationRef'
import { fireAppLaunched } from './regLaunchedEvent'
import { removeComponentId } from '@/core/common'
import {
  HOME_SCREEN,
  PLAY_DETAIL_SCREEN,
  SONGLIST_DETAIL_SCREEN,
  COMMENT_SCREEN,
  VERSION_MODAL,
  PACT_MODAL,
  SYNC_MODE_MODAL,
} from './screenNames'

const Stack = createNativeStackNavigator()

// 注入 componentId = route.key,并把 route.params 展开为 props(兼容 RNN passProps)
const wrap = (Component: any) => {
  return function Screen({ route }: any) {
    return <Component componentId={route.key} {...(route.params ?? {})} />
  }
}

const collectKeys = (state: any, out: Set<string>) => {
  if (!state?.routes) return
  for (const r of state.routes) {
    if (r.key) out.add(r.key)
    if (r.state) collectKeys(r.state, out)
  }
}

export default function Root() {
  const [ready, setReady] = useState(false)
  const prevKeys = useRef<Set<string>>(new Set())

  useEffect(() => {
    // 触发启动处理链(app.ts 注册的 init 回调),并等待 init 完成后渲染导航
    void fireAppLaunched()
    let mounted = true
    void appReadyPromise.then(() => { if (mounted) setReady(true) })
    return () => { mounted = false }
  }, [])

  const handleStateChange = () => {
    const keys = new Set<string>()
    collectKeys(navigationRef.getRootState(), keys)
    for (const k of prevKeys.current) if (!keys.has(k)) removeComponentId(k)
    prevKeys.current = keys
  }

  return (
    <Provider>
      {ready
        ? (
          <NavigationContainer ref={navigationRef} onStateChange={handleStateChange}>
            <Stack.Navigator
              initialRouteName={HOME_SCREEN}
              screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
            >
              <Stack.Screen name={HOME_SCREEN}>{wrap(Home)}</Stack.Screen>
              <Stack.Screen name={PLAY_DETAIL_SCREEN}>{wrap(PlayDetail)}</Stack.Screen>
              <Stack.Screen name={SONGLIST_DETAIL_SCREEN}>{wrap(SonglistDetail)}</Stack.Screen>
              <Stack.Screen name={COMMENT_SCREEN}>{wrap(Comment)}</Stack.Screen>
              <Stack.Group screenOptions={{ presentation: 'transparentModal', animation: 'fade' }}>
                <Stack.Screen name={VERSION_MODAL}>{wrap(VersionModal)}</Stack.Screen>
                <Stack.Screen name={PACT_MODAL}>{wrap(PactModal)}</Stack.Screen>
                <Stack.Screen name={SYNC_MODE_MODAL}>{wrap(SyncModeModal)}</Stack.Screen>
              </Stack.Group>
            </Stack.Navigator>
          </NavigationContainer>
          )
        : null}
    </Provider>
  )
}
