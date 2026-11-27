import { useEffect, useState } from 'react'

import { getListMusics } from '@/core/list'
import { LIST_IDS } from '@/config/constant'
import { getListMusicSync } from '@/utils/listManage'

/** 「我喜欢」列表里的歌：读 LIST_IDS.LOVE，订阅 myListMusicUpdate，不改收藏逻辑 */
export const useLoveSongs = (): LX.Music.MusicInfo[] => {
  // 克隆取数：listMusicAdd 原地 mutate 缓存数组，同引用 setState 会被 bail out、收藏后不刷新
  const [songs, setSongs] = useState(() => [...getListMusicSync(LIST_IDS.LOVE)])

  useEffect(() => {
    const refresh = () => {
      // 同上：getListMusicSync 回的是缓存内同一数组引用，必须克隆后再 setState
      setSongs([...getListMusicSync(LIST_IDS.LOVE)])
    }
    // 首屏时缓存里可能还没有这份列表，走一次 core/list 取数（内部自带缓存）
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
