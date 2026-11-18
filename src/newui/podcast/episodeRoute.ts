/**
 * 「回到当前这一集的单集屏」的入口（本轮只出函数，不出 UI）。
 *
 * 单集跨屏播放之后，「正在播的是哪一集」不再等价于「哪一屏挂着」，所以迷你条一旦要有
 * 「点一下回到这一集」的动作，就不能自己拼 passProps——那一屏要的是整份单集视图模型
 * （集名 / 时长 / 日期 / 简介 / 直链 / 下标），只有播放模块手里才有最新那一份。
 *
 * 分工：`podPlayer.ts` 出数据（`getPodEpisodeTarget`，纯数据、不碰导航），这里只负责把它
 * 送进既有入口 `pushNewUiEpisode`。这样数据层不必反向依赖屏与导航，迷你条那边也只需要记住
 * 一个函数名。
 */
import { pushNewUiEpisode } from '@/newui/navigation/entry'

import { getPodEpisodeTarget } from './podPlayer'

/**
 * 跳回当前在播的那一集（没有在播的一集时返回 false，调用方据此不做动作）。
 * `componentId` 传调用方自己的层 id——RNN 的 push 需要一个挂点。
 */
export const openPodEpisodeScreen = (componentId: string): boolean => {
  const target = getPodEpisodeTarget()
  if (target == null) return false
  void pushNewUiEpisode(componentId, target)
  return true
}
