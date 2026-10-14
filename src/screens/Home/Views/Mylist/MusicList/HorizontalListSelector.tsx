import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useMyList, useActiveListId } from '@/store/list/hook'
import { createStyle } from '@/utils/tools'
import { setActiveList } from '@/core/list'
import Text from '@/components/common/Text'
import { LIST_IDS } from '@/config/constant'
import { useSettingValue } from '@/store/setting/hook'
import { Icon } from '@/components/common/Icon'
import ListMenu, { type ListMenuType, type Position } from './ListMenu'
import ListNameEdit, { type ListNameEditType } from '../MyList/ListNameEdit'
import ListMusicSort, { type ListMusicSortType } from '../MyList/ListMusicSort'
import DuplicateMusic, { type DuplicateMusicType } from '../MyList/DuplicateMusic'
import ListImportExport, { type ListImportExportType } from '../MyList/ListImportExport'
import { handleRemove, handleSync } from '../MyList/listAction'
import { scaleSizeW } from '@/utils/pixelRatio'
import listState from '@/store/list/state'
import { useI18n } from '@/lang'
import musicSdk from '@/utils/musicSdk'
import Menu, { type Menus, type MenuType } from '@/components/common/Menu'

const menuItemWidth = scaleSizeW(110)

const styles = createStyle({
  container: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 6,
  },
  listContent: {
    paddingLeft: 10,
    paddingRight: 10,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 4,
    marginRight: 8,
    borderRadius: 4,
  },
  tabItemActive: {
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  moreBtn: {
    height: 16,
    width: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
  },
})

const TabItem = memo(({ id, name, isActive, onPress, onShowMenu, index }: {
  id: string
  name: string
  isActive: boolean
  onPress: (id: string) => void
  onShowMenu: (info: { listInfo: LX.List.MyListInfo, index: number }, position: Position) => void
  index: number
}) => {
  const theme = useTheme()
  const t = useI18n()
  const moreButtonRef = useRef<TouchableOpacity>(null)
  const menuRef = useRef<MenuType>(null)
  const listNameEditRef = useRef<ListNameEditType>(null)
  const listMusicSortRef = useRef<ListMusicSortType>(null)
  const duplicateMusicRef = useRef<DuplicateMusicType>(null)
  const listImportExportRef = useRef<ListImportExportType>(null)
  const [menus, setMenus] = useState<Menus>([])
  const [visible, setVisible] = useState(false)
  const selectInfoRef = useRef<{ listInfo: LX.List.MyListInfo, index: number }>({ listInfo: {} as LX.List.MyListInfo, index: 0 })

  const handleSetMenu = (listInfo: LX.List.MyListInfo) => {
    let rename = false
    let sync = false
    let remove = false
    let local_file = !listState.fetchingListStatus[listInfo.id]
    let userList: LX.List.UserListInfo
    switch (listInfo.id) {
      case LIST_IDS.DEFAULT:
      case LIST_IDS.LOVE:
      case LIST_IDS.TEMP:
        break
      default:
        userList = listInfo as LX.List.UserListInfo
        rename = true
        remove = true
        sync = !!(userList.source && musicSdk[userList.source]?.songList)
        break
    }

    setMenus([
      { action: 'rename', disabled: !rename, label: t('list_rename') },
      { action: 'sort', label: t('list_sort') },
      { action: 'duplicateMusic', label: t('lists__duplicate') },
      { action: 'sync', disabled: !sync || !local_file, label: t('list_sync') },
      { action: 'import', label: t('list_import') },
      { action: 'export', label: t('list_export') },
      { action: 'remove', disabled: !remove, label: t('list_remove') },
    ])
  }

  const handleShowMenu = () => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        const position: Position = { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) }
        const listInfo = { id, name } as LX.List.MyListInfo
        selectInfoRef.current = { listInfo, index }
        handleSetMenu(listInfo)
        if (visible) menuRef.current?.show(position)
        else {
          setVisible(true)
          requestAnimationFrame(() => {
            menuRef.current?.show(position)
          })
        }
      })
    }
  }

  const handleMenuPress = ({ action }: typeof menus[number]) => {
    const selectInfo = selectInfoRef.current
    switch (action) {
      case 'rename':
        listNameEditRef.current?.show(selectInfo.listInfo as LX.List.UserListInfo)
        break
      case 'sort':
        listMusicSortRef.current?.show(selectInfo.listInfo)
        break
      case 'duplicateMusic':
        duplicateMusicRef.current?.show(selectInfo.listInfo)
        break
      case 'import':
        listImportExportRef.current?.import(selectInfo.listInfo, selectInfo.index)
        break
      case 'export':
        listImportExportRef.current?.export(selectInfo.listInfo, selectInfo.index)
        break
      case 'sync':
        handleSync(selectInfo.listInfo as LX.List.UserListInfo)
        break
      case 'remove':
        handleRemove(selectInfo.listInfo as LX.List.UserListInfo)
        break
      default:
        break
    }
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.tabItem, isActive && styles.tabItemActive]}
        onPress={() => onPress(id)}
      >
        <Text
          size={15}
          color={isActive ? theme['c-primary-font'] : theme['c-font']}
          style={{ fontWeight: isActive ? '600' : '400' }}
        >
          {name}
        </Text>
        <TouchableOpacity style={styles.moreBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={handleShowMenu} ref={moreButtonRef}>
          <Icon name="dots-vertical" color={theme['c-350']} size={12} />
        </TouchableOpacity>
      </TouchableOpacity>
      {visible ? (
        <Menu
          ref={menuRef}
          menus={menus}
          onPress={handleMenuPress}
          width={menuItemWidth}
        />
      ) : null}
      <ListNameEdit ref={listNameEditRef} />
      <ListMusicSort ref={listMusicSortRef} />
      <DuplicateMusic ref={duplicateMusicRef} />
      <ListImportExport ref={listImportExportRef} />
    </>
  )
})

export default memo(() => {
  const theme = useTheme()
  const allList = useMyList()
  const activeListId = useActiveListId()
  const langId = useSettingValue('common.langId')

  useEffect(() => {
    // 进入“我的列表”时默认选中第一个标签（试听列表）
    setActiveList(LIST_IDS.DEFAULT)
    const handleNavChange = (id: string) => {
      if (id == 'nav_love') setActiveList(LIST_IDS.DEFAULT)
    }
    global.state_event.on('navActiveIdUpdated', handleNavChange)
    return () => {
      global.state_event.off('navActiveIdUpdated', handleNavChange)
    }
  }, [])

  const tabs = useMemo(() => {
    return allList.map(l => {
      switch (l.id) {
        case LIST_IDS.TEMP:
          return { id: l.id, name: global.i18n.t('list_name_temp') }
        case LIST_IDS.DEFAULT:
          return { id: l.id, name: global.i18n.t('list_name_default') }
        case LIST_IDS.LOVE:
          return { id: l.id, name: global.i18n.t('list_name_love') }
        default:
          return { id: l.id, name: l.name }
      }
    })
  }, [langId, allList])

  const handlePress = (id: string) => {
    setActiveList(id)
  }

  const handleShowMenu = (info: { listInfo: LX.List.MyListInfo, index: number }, position: Position) => {
    // Menu is now handled within each TabItem
  }

  return (
    <View style={{
      ...styles.container,
      backgroundColor: theme['c-content-background'],
    }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {tabs.map((tab, index) => (
          <TabItem
            key={tab.id}
            id={tab.id}
            name={tab.name}
            isActive={activeListId === tab.id}
            onPress={handlePress}
            onShowMenu={handleShowMenu}
            index={index}
          />
        ))}
      </ScrollView>
    </View>
  )
})