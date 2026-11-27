import { useSyncExternalStore } from 'react'

import {
  getContentPlatformSnapshot,
  subscribeContentPlatform,
  type NewUiContentPlatform,
} from '@/newui/utils/contentPlatform'

/**
 * 「内容平台」唯一读取 hook：读持久化设置 + 订阅切换脉冲。
 * 首页推荐、歌单页分类与池子经它取 source / sortId，切平台后自动重取。
 */
export const useContentPlatform = (): NewUiContentPlatform =>
  useSyncExternalStore(subscribeContentPlatform, getContentPlatformSnapshot)
