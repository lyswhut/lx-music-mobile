import { useEffect, useRef, useState } from 'react'
import MySonglistEditModal, {
  type MySonglistEditModalType,
} from '@/components/MySonglistEditModal'
import { createStyle } from '@/utils/tools'
import { View } from 'react-native'
import ActionBar from './ActionBar'
import List from './List'
import ListMenu, { type ListMenuType, type SelectInfo } from './ListMenu'
import { handleRemove, handleOpenDetail } from './listAction'
import commonState from '@/store/common/state'

export default () => {
  const [visible, setVisible] = useState(commonState.navActiveId == 'nav_mysonglist')
  const listMenuRef = useRef<ListMenuType>(null)
  const editModalRef = useRef<MySonglistEditModalType>(null)

  useEffect(() => {
    let isInited = false
    const changeVisible = (id: typeof commonState.navActiveId) => {
      if (id == 'nav_mysonglist' && !isInited) {
        requestAnimationFrame(() => setVisible(true))
        isInited = true
      }
    }
    global.state_event.on('navActiveIdUpdated', changeVisible)
    if (commonState.navActiveId == 'nav_mysonglist') {
      setVisible(true)
      isInited = true
    }
    return () => {
      global.state_event.off('navActiveIdUpdated', changeVisible)
    }
  }, [])

  const handleShowMenu = (info: SelectInfo, position: { x: number, y: number, w: number, h: number }) => {
    listMenuRef.current?.show(info, position)
  }

  const handleEdit = (listInfo: LX.List.UserListInfo) => {
    editModalRef.current?.show(listInfo)
  }

  const handleNew = () => {
    editModalRef.current?.showCreate()
  }

  const handleRemoveList = (listInfo: LX.List.UserListInfo) => {
    void handleRemove(listInfo.id)
  }

  const handleItemPress = (item: LX.List.UserListInfo, index: number) => {
    handleOpenDetail(item.id)
  }

  return (
    visible ? (
      <View style={styles.container}>
        <ActionBar onNew={handleNew} />
        <List onShowMenu={handleShowMenu} onPress={handleItemPress} />
        <ListMenu
          ref={listMenuRef}
          onEdit={handleEdit}
          onRemove={handleRemoveList}
        />
        <MySonglistEditModal ref={editModalRef} />
      </View>
    ) : null
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
})
