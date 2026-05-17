import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import { useI18n } from '@/lang'
import Menu, { type Menus, type MenuType, type Position } from '@/components/common/Menu'
import { scaleSizeW } from '@/utils/pixelRatio'

export interface SelectInfo {
  listInfo: LX.List.UserListInfo
  index: number
}

const initSelectInfo = {} as SelectInfo

const menuItemWidth = scaleSizeW(110)

export interface ListMenuProps {
  onEdit: (listInfo: LX.List.UserListInfo) => void
  onRemove: (listInfo: LX.List.UserListInfo) => void
}

export interface ListMenuType {
  show: (selectInfo: SelectInfo, position: Position) => void
}

export default forwardRef<ListMenuType, ListMenuProps>(({ onEdit, onRemove }, ref) => {
  const t = useI18n()
  const menuRef = useRef<MenuType>(null)
  const selectInfoRef = useRef<SelectInfo>(initSelectInfo)
  const [menus] = useState<Menus>([
    { action: 'edit', label: t('my_songlist_menu_edit') },
    { action: 'remove', label: t('my_songlist_menu_remove') },
  ])
  const [visible, setVisible] = useState(false)

  useImperativeHandle(ref, () => ({
    show(selectInfo, position) {
      selectInfoRef.current = selectInfo
      if (visible) menuRef.current?.show(position)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          menuRef.current?.show(position)
        })
      }
    },
  }))

  const handleMenuPress = ({ action }: typeof menus[number]) => {
    const info = selectInfoRef.current
    switch (action) {
      case 'edit':
        onEdit(info.listInfo)
        break
      case 'remove':
        onRemove(info.listInfo)
        break
    }
  }

  return (
    visible ? (
      <Menu
        ref={menuRef}
        menus={menus}
        onPress={handleMenuPress}
        width={menuItemWidth}
      />
    ) : null
  )
})
