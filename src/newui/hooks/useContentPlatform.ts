import { useSyncExternalStore } from 'react'

import {
  getContentPlatformSnapshot,
  subscribeContentPlatform,
  type NewUiContentPlatform,
} from '@/newui/utils/contentPlatform'

/**
 * 「内容平台」唯一读取 hook：读持久化设置 + 订阅音源浮层的切换脉冲。
 * 首页推荐歌单 / 首页热门单曲 / 歌单页分类与池子都经它取 source / sortId，
 * 切平台后快照换新 → 依赖它的取数 hook 自动重取。
 * 排行榜页只拿它的 source 做**卡片排序**（当前平台的榜排最前，五平台全列，
 * 快照换新即重排、不重取目录）；搜索全平台并发**不**用本 hook。
 * （口径见 utils/contentPlatform。）
 */
export const useContentPlatform = (): NewUiContentPlatform =>
  useSyncExternalStore(subscribeContentPlatform, getContentPlatformSnapshot)
