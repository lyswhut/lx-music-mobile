import { createList, setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { getListDetail, getListDetailAll } from '@/core/songlist'
import { LIST_IDS } from '@/config/constant'
import listState from '@/store/list/state'
import syncSourceList from '@/core/syncSourceList'
import { confirmDialog, toast } from '@/utils/tools'
import { type Source } from '@/store/songlist/state'


export const handlePlay = async(listId: string, source: Source, list?: LX.Music.MusicInfoOnline[], index = 0) => {
  let isPlayingList = false
  // console.log(list)
  if (!list?.length) list = (await getListDetail(listId, source, 1)).list
  if (list?.length) {
    await setTempList(listId, [...list])
    void playList(LIST_IDS.TEMP, index)
    isPlayingList = true
  }
  const fullList = await getListDetailAll(source, listId)
  if (!fullList.length) return
  if (isPlayingList) {
    if (listState.tempListMeta.id == listId) {
      await setTempList(listId, [...fullList])
    }
  } else {
    await setTempList(listId, [...fullList])
    void playList(LIST_IDS.TEMP, index)
  }
}

export const handleCollect = async(listId: string, source: Source, name: string) => {
  const targetList = listState.userList.find(l => l.id == listId)
  if (targetList) {
    const confirm = await confirmDialog({
      message: global.i18n.t('duplicate_list_tip', { name: targetList.name }),
      cancelButtonText: global.i18n.t('list_import_part_button_cancel'),
      confirmButtonText: global.i18n.t('confirm_button_text'),
    })
    if (!confirm) return
    void syncSourceList(targetList)
    return
  }

  const list = await getListDetailAll(source, listId)
  await createList({
    name,
    id: listId,
    list,
    source,
    sourceListId: listId,
  })
  toast(global.i18n.t('collect_success'))
}
