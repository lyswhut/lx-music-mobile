/**
 * 页面导航动作(保持原 push* 签名,内部改用 react-navigation navigationRef)。
 * 原 RNN 的 componentId 参数保留以兼容调用方,但不再用于寻址。
 */
import { navigate, resetToHome, markAppReady } from './navigationRef'
import {
  HOME_SCREEN,
  PLAY_DETAIL_SCREEN,
  SONGLIST_DETAIL_SCREEN,
  COMMENT_SCREEN,
} from './screenNames'
import { type ListInfoItem } from '@/store/songlist/state'

export async function pushHomeScreen() {
  // 核心 init 完成后由 app.ts 调用:标记就绪(让 Root 渲染导航),并确保根为 Home
  markAppReady()
  resetToHome(HOME_SCREEN)
}

export function pushPlayDetailScreen(componentId: string, skipAnimation = false) {
  requestAnimationFrame(() => {
    navigate(PLAY_DETAIL_SCREEN)
  })
}

export function pushSonglistDetailScreen(componentId: string, info: ListInfoItem) {
  requestAnimationFrame(() => {
    navigate(SONGLIST_DETAIL_SCREEN, { info })
  })
}

export function pushCommentScreen(componentId: string) {
  requestAnimationFrame(() => {
    navigate(COMMENT_SCREEN)
  })
}
