import { LIST_IDS } from '@/config/constant'
import { setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { getListDetail, getListDetailAll } from '@/core/songlist'
import listState from '@/store/list/state'

const getListPlayIndex = (list: LX.Music.MusicInfoOnline[], index?: number) => {
  if (index == null) {
    index = 1
  } else {
    if (index < 1) index = 1
    else if (index > list.length) index = list.length
  }
  return index - 1
}

const playSongListDetail = async(source: LX.OnlineSource, link: string, playIndex?: number) => {
  // console.log(source, link, playIndex)
  if (link == null) return
  let isPlayingList = false
  const id = decodeURIComponent(link)
  const playListId = `${source}__${decodeURIComponent(link)}`
  let list = (await getListDetail(id, source, 1)).list
  if (playIndex == null || list.length > playIndex) {
    isPlayingList = true
    await setTempList(playListId, list)
    await playList(LIST_IDS.TEMP, getListPlayIndex(list, playIndex))
  }
  list = await getListDetailAll(source, id)
  if (isPlayingList) {
    if (listState.tempListMeta.id == id) await setTempList(playListId, list)
  } else {
    await setTempList(playListId, list)
    await playList(LIST_IDS.TEMP, getListPlayIndex(list, playIndex))
  }
}
export const playSonglist = async(source: LX.OnlineSource, link: string, playIndex?: number) => {
  try {
    await playSongListDetail(source, link, playIndex)
  } catch (err) {
    console.error(err)
    throw new Error('Get play list failed.')
  }
}
