import type { ComponentType } from 'react'
import { Navigation } from 'react-native-navigation'

import { Provider } from '@/store/Provider'
import {
  MainScreen,
  OfflineScreen,
  PlayerScreen,
  SearchScreen,
  SonglistDetailScreen,
  WelcomeScreen,
} from '@/newui/screens'
import { ThemeProvider } from '@/newui/theme'
// 直连具体模块（不走 @/newui/utils 桶口），与 wySonglistDetail 同一做法
import { installGestureBarFusion } from '@/newui/utils/gestureBar'
import { installWySonglistDetailWeapi } from '@/newui/utils/wySonglistDetail'

import {
  NEW_UI_MAIN_SCREEN,
  NEW_UI_OFFLINE_SCREEN,
  NEW_UI_PLAYER_SCREEN,
  NEW_UI_SEARCH_SCREEN,
  NEW_UI_SONGLIST_DETAIL_SCREEN,
  NEW_UI_WELCOME_SCREEN,
} from './screenNames'

/**
 * 新 UI 屏幕注册：Provider（既有业务状态）+ ThemeProvider（新 UI 主题）各包一层。
 */
const withNewUiProviders = (Component: ComponentType<any>) =>
  function NewUiScreen(props: Record<string, any>) {
    return (
      <Provider>
        <ThemeProvider>
          <Component {...props} />
        </ThemeProvider>
      </Provider>
    )
  }

export const registerNewUiScreens = () => {
  // 网易歌单详情 weapi 优先通道（详见 utils/wySonglistDetail 注释）
  installWySonglistDetailWeapi()
  // 手势栏融合全局重铺监听（RNN 转场会抢回非 edge 布局，详见 utils/gestureBar 注释）
  installGestureBarFusion()
  Navigation.registerComponent(NEW_UI_MAIN_SCREEN, () => withNewUiProviders(MainScreen))
  Navigation.registerComponent(NEW_UI_PLAYER_SCREEN, () => withNewUiProviders(PlayerScreen))
  Navigation.registerComponent(NEW_UI_SEARCH_SCREEN, () => withNewUiProviders(SearchScreen))
  Navigation.registerComponent(NEW_UI_SONGLIST_DETAIL_SCREEN, () =>
    withNewUiProviders(SonglistDetailScreen))
  Navigation.registerComponent(NEW_UI_OFFLINE_SCREEN, () => withNewUiProviders(OfflineScreen))
  // 欢迎屏底色/文字跟随主题，需包 ThemeProvider（与其余屏同一套 wrapper）
  Navigation.registerComponent(NEW_UI_WELCOME_SCREEN, () => withNewUiProviders(WelcomeScreen))
}
