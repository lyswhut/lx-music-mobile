import { useEffect, useState } from 'react'

import { getListMusics } from '@/core/list'
import { LIST_IDS } from '@/config/constant'
import { getListMusicSync } from '@/utils/listManage'

/**
 * 「我喜欢」列表里的歌。
 * 读的是既有列表体系（LIST_IDS.LOVE），订阅 app_event 的 myListMusicUpdate，
 * 不改动任何收藏逻辑；收藏动作本身要等播放浮层那一轮接既有 collectMusic。
 */
export const useLoveSongs = (): LX.Music.MusicInfo[] => {
  // 克隆取数：listMusicAdd 对缓存数组原地 mutate（utils/listManage.ts L232-236 arrUnshift/arrPush），
  // 同引用 setState 会被 React bail out、收藏后界面不刷新；克隆保证收藏 / 取消收藏即时可见
  const [songs, setSongs] = useState(() => [...getListMusicSync(LIST_IDS.LOVE)])

  useEffect(() => {
    const refresh = () => {
      // 同上：getListMusicSync 回的是缓存内同一数组引用，必须克隆后再 setState
      setSongs([...getListMusicSync(LIST_IDS.LOVE)])
    }
    // 首屏时缓存里可能还没这份列表，走一次既有 core/list 的取数（内部自带缓存）
    void getListMusics(LIST_IDS.LOVE).then(refresh)
    const handleUpdate = (ids: string[]) => {
      if (ids.includes(LIST_IDS.LOVE)) refresh()
    }
    global.app_event.on('myListMusicUpdate', handleUpdate)
    return () => {
      global.app_event.off('myListMusicUpdate', handleUpdate)
    }
  }, [])

  return songs
}
