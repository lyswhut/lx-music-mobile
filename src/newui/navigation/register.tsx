import type { ComponentType } from 'react'
import { Navigation } from 'react-native-navigation'

import { Provider } from '@/store/Provider'
import {
  EpisodeScreen,
  MainScreen,
  OfflineScreen,
  PlayerScreen,
  PodcastDetailScreen,
  PodcastSearchScreen,
  RadioHomeScreen,
  SearchScreen,
  SonglistDetailScreen,
} from '@/newui/screens'
import { ThemeProvider } from '@/newui/theme'

import {
  NEW_UI_EPISODE_SCREEN,
  NEW_UI_MAIN_SCREEN,
  NEW_UI_OFFLINE_SCREEN,
  NEW_UI_PLAYER_SCREEN,
  NEW_UI_PODCAST_DETAIL_SCREEN,
  NEW_UI_PODCAST_SEARCH_SCREEN,
  NEW_UI_RADIO_HOME_SCREEN,
  NEW_UI_SEARCH_SCREEN,
  NEW_UI_SONGLIST_DETAIL_SCREEN,
} from './screenNames'

/**
 * 新 UI 屏幕的依赖注入：
 * - Provider（旧 @/store/Provider）保留，业务状态 / 播放 / 音源逻辑仍由既有代码驱动
 * - ThemeProvider 是新 UI 自己的主题（与旧 store/theme 无关）
 * 与旧 registerScreens 的 WrappedComponent 等价，但独立维护、互不影响。
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
  Navigation.registerComponent(NEW_UI_RADIO_HOME_SCREEN, () => withNewUiProviders(RadioHomeScreen))
  Navigation.registerComponent(NEW_UI_PODCAST_DETAIL_SCREEN, () =>
    withNewUiProviders(PodcastDetailScreen))
  Navigation.registerComponent(NEW_UI_PODCAST_SEARCH_SCREEN, () =>
    withNewUiProviders(PodcastSearchScreen))
  Navigation.registerComponent(NEW_UI_EPISODE_SCREEN, () => withNewUiProviders(EpisodeScreen))

  console.info('New UI screens have been registered...')
}
