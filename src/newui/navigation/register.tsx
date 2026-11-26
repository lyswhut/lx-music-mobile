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
  Navigation.registerComponent(NEW_UI_MAIN_SCREEN, () => withNewUiProviders(MainScreen))
  Navigation.registerComponent(NEW_UI_PLAYER_SCREEN, () => withNewUiProviders(PlayerScreen))
  Navigation.registerComponent(NEW_UI_SEARCH_SCREEN, () => withNewUiProviders(SearchScreen))
  Navigation.registerComponent(NEW_UI_SONGLIST_DETAIL_SCREEN, () =>
    withNewUiProviders(SonglistDetailScreen))
  Navigation.registerComponent(NEW_UI_OFFLINE_SCREEN, () => withNewUiProviders(OfflineScreen))
  // 欢迎屏底色/文字跟随主题，需包 ThemeProvider（与其余屏同一套 wrapper）
  Navigation.registerComponent(NEW_UI_WELCOME_SCREEN, () => withNewUiProviders(WelcomeScreen))
}
