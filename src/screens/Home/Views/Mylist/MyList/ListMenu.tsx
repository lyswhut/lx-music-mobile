import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import { useI18n } from '@/lang'
import Menu, { type Menus, type MenuType, type Position } from '@/components/common/Menu'
import { LIST_IDS } from '@/config/constant'
import musicSdk from '@/utils/musicSdk'
import { scaleSizeW } from '@/utils/pixelRatio'
import listState from '@/store/list/state'

export interface SelectInfo {
  listInfo: LX.List.MyListInfo
  // selectedList: LX.Music.MusicInfo[]
  index: number
  // listId: string
  // single: boolean
}
const initSelectInfo = {}

const menuItemWidth = scaleSizeW(110)


export interface ListMenuProps {
  onNew: (position: number) => void
  onRename: (listInfo: LX.List.UserListInfo) => void
  onSort: (listInfo: LX.List.MyListInfo) => void
  onDuplicateMusic: (listInfo: LX.List.MyListInfo) => void
  onImport: (listInfo: LX.List.MyListInfo, index: number) => void
  onExport: (listInfo: LX.List.MyListInfo, index: number) => void
  onSync: (listInfo: LX.List.UserListInfo) => void
  onSelectLocalFile: (listInfo: LX.List.MyListInfo, index: number) => void
  onRemove: (listInfo: LX.List.UserListInfo) => void
}
export interface ListMenuType {
  show: (selectInfo: SelectInfo, position: Position) => void
}

export type {
  Position,
}

export default forwardRef<ListMenuType, ListMenuProps>(({
  onNew,
  onRename,
  onSort,
  onDuplicateMusic,
  onImport,
  onExport,
  onSync,
  onSelectLocalFile,
  onRemove,
}, ref) => {
  const t = useI18n()
  const menuRef = useRef<MenuType>(null)
  const selectInfoRef = useRef<SelectInfo>(initSelectInfo as SelectInfo)
  const [menus, setMenus] = useState<Menus>([])
  const [visible, setVisible] = useState(false)

  useImperativeHandle(ref, () => ({
    show(selectInfo, position) {
      selectInfoRef.current = selectInfo
      handleSetMenu(selectInfo.listInfo)
      if (visible) menuRef.current?.show(position)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          menuRef.current?.show(position)
        })
      }
    },
  }))

  const handleSetMenu = (listInfo: LX.List.MyListInfo) => {
    let rename = false
    let sync = false
    let remove = false
    let local_file = !listState.fetchingListStatus[listInfo.id]
    let userList: LX.List.UserListInfo
    switch (listInfo.id) {
      case LIST_IDS.DEFAULT:
      case LIST_IDS.LOVE:
        break
      default:
        userList = listInfo as LX.List.UserListInfo
        rename = true
        remove = true
        sync = !!(userList.source && musicSdk[userList.source]?.songList)
        break
    }

    setMenus([
      { action: 'new', label: t('list_create') },
      { action: 'rename', disabled: !rename, label: t('list_rename') },
      { action: 'sort', label: t('list_sort') },
      { action: 'duplicateMusic', label: t('lists__duplicate') },
      { action: 'local_file', disabled: !local_file, label: t('list_select_local_file') },
      { action: 'sync', disabled: !sync || !local_file, label: t('list_sync') },
      { action: 'import', label: t('list_import') },
      { action: 'export', label: t('list_export') },
      // { action: 'changePosition', label: t('change_position') },
      { action: 'remove', disabled: !remove, label: t('list_remove') },
    ])
  }

  const handleMenuPress = ({ action }: typeof menus[number]) => {
    const selectInfo = selectInfoRef.current
    switch (action) {
      case 'new':
        onNew(Math.max(selectInfo.index - 1, 0))
        break
      case 'rename':
        onRename(selectInfo.listInfo as LX.List.UserListInfo)
        break
      case 'sort':
        onSort(selectInfo.listInfo)
        break
      case 'duplicateMusic':
        onDuplicateMusic(selectInfo.listInfo)
        break
      case 'import':
        onImport(selectInfo.listInfo, selectInfo.index)
        break
      case 'export':
        onExport(selectInfo.listInfo, selectInfo.index)
        break
      case 'sync':
        onSync(selectInfo.listInfo as LX.List.UserListInfo)
        break
        // case 'changePosition':

        //   break
      case 'local_file':
        onSelectLocalFile(selectInfo.listInfo, selectInfo.index)
        break
      case 'remove':
        onRemove(selectInfo.listInfo as LX.List.UserListInfo)
        break

      default:
        break
    }
  }

  return (
    visible
      ? <Menu
          ref={menuRef}
          menus={menus}
          onPress={handleMenuPress}
          width={menuItemWidth}
        />
      : null
  )
})
