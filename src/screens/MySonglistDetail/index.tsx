import { useEffect, useRef, useState } from 'react'
import PageContent from '@/components/PageContent'
import StatusBar from '@/components/common/StatusBar'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import PlayerBar from '@/components/player/PlayerBar'
import listState from '@/store/list/state'
import Header from './Header'
import MusicList from './MusicList'
import { SonglistInfoContext } from './state'
import { pop } from '@/navigation'
import MySonglistEditModal, {
  type MySonglistEditModalType,
} from '@/components/MySonglistEditModal'

export default ({ componentId, listId }: {
  componentId: string
  listId: string
}) => {
  const [info, setInfo] = useState<LX.List.UserListInfo | null>(
    listState.userList.find(l => l.id === listId) ?? null
  )
  const editModalRef = useRef<MySonglistEditModalType>(null)

  useEffect(() => {
    setComponentId(COMPONENT_IDS.mySonglistDetail, componentId)

    // list_update 底层传递的是数组 LX.List.UserListInfo[]（见 event/listEvent.ts）
    const handleListUpdate = async (lists: LX.List.UserListInfo[]) => {
      const updated = lists.find(l => l.id === listId)
      if (updated) setInfo(updated)
    }
    const handleListRemove = async (ids: string[]) => {
      if (ids.includes(listId)) {
        pop(componentId)
      }
    }

    global.list_event.on('list_update', handleListUpdate)
    global.list_event.on('list_remove', handleListRemove)

    return () => {
      global.list_event.off('list_update', handleListUpdate)
      global.list_event.off('list_remove', handleListRemove)
    }
  }, [listId, componentId])

  const handleEdit = () => {
    if (!info) return
    editModalRef.current?.show(info)
  }

  if (!info) return null

  return (
    <PageContent>
      <StatusBar />
      <SonglistInfoContext.Provider value={info}>
        <Header componentId={componentId} onEdit={handleEdit} />
        <MusicList componentId={componentId} listId={listId} />
      </SonglistInfoContext.Provider>
      <PlayerBar />
      <MySonglistEditModal
        ref={editModalRef}
      />
    </PageContent>
  )
}
