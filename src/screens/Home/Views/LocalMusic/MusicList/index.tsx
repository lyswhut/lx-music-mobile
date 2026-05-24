import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, FlatList, TouchableOpacity } from 'react-native'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'
import ListItem from './ListItem'
import ListMenu, { type ListMenuType } from './ListMenu'
import MusicMultiAddSonglistModal, { type MusicMultiAddSonglistModalType } from '@/components/MusicMultiAddSonglistModal'
import { createStyle, toast } from '@/utils/tools'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { BorderWidths } from '@/theme'
import { getData, saveData } from '@/plugins/storage'

const SORT_FIELD_KEY = '@localmusic_sort_field'
const SORT_ORDER_KEY = '@localmusic_sort_order'

type SortField = 'name' | 'lastModified'
type SortOrder = 'asc' | 'desc'

interface MusicListProps {
  musics: LX.Music.MusicInfoLocal[]
}

const ITEM_HEIGHT = 54

export default ({ musics }: MusicListProps) => {
  const t = useI18n()
  const theme = useTheme()

  // 加载排序偏好
  useEffect(() => {
    void (async () => {
      try {
        const [savedField, savedOrder] = await Promise.all([
          getData<SortField>(SORT_FIELD_KEY),
          getData<SortOrder>(SORT_ORDER_KEY),
        ])
        if (savedField) setSortField(savedField)
        if (savedOrder) setSortOrder(savedOrder)
      } catch { /* ignore */ }
    })()
  }, [])
  const listMenuRef = useRef<ListMenuType>(null)
  const musicMultiAddSonglistModalRef = useRef<MusicMultiAddSonglistModalType>(null)
  const [listWidth, setListWidth] = useState(300)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [showSortMenu, setShowSortMenu] = useState(false)

  // 多选状态管理
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  // 使用 musicInfo.id 作为选中标识，弃用 index
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  // 已选列表通过 useMemo 派生
  const selectedList = useMemo(
    () => musics.filter(m => selectedIds.has(m.id)),
    [musics, selectedIds]
  )

  // 排序逻辑
  const sortedMusics = useMemo(() => {
    const sorted = [...musics]
    sorted.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name, 'zh-CN')
      } else {
        const aTime = a.meta.lastModified ?? 0
        const bTime = b.meta.lastModified ?? 0
        cmp = aTime - bTime
      }
      return sortOrder === 'desc' ? -cmp : cmp
    })
    return sorted
  }, [musics, sortField, sortOrder])

  const handleSortChange = useCallback((field: SortField, order: SortOrder) => {
    setSortField(field)
    setSortOrder(order)
    void saveData(SORT_FIELD_KEY, field)
    void saveData(SORT_ORDER_KEY, order)
    setShowSortMenu(false)
  }, [])

  const handleLayout = useCallback((e: any) => {
    setListWidth(e.nativeEvent.layout.width)
  }, [])

  const handlePlay = useCallback(async (item: LX.Music.MusicInfoLocal) => {
    // FlatList 传的是排序后索引，需转换为原始列表索引
    const originalIndex = musics.findIndex(m => m.id === item.id)
    await playList(LIST_IDS.TEMP, originalIndex)
  }, [musics])

  const handleShowMenu = useCallback(
    (musicInfo: LX.Music.MusicInfoLocal) => {
      listMenuRef.current?.show({ musicInfo })
    },
    [],
  )

  // 长按进入多选模式
  const handleLongPress = useCallback((musicInfo: LX.Music.MusicInfoLocal) => {
    setIsMultiSelectMode(true)
    setSelectedIds(new Set([musicInfo.id]))
  }, [])

  // 选中/取消选中
  const handleSelect = useCallback((musicInfo: LX.Music.MusicInfoLocal) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(musicInfo.id)) {
        next.delete(musicInfo.id)
      } else {
        next.add(musicInfo.id)
      }
      return next
    })
  }, [])

  // 退出多选模式
  const handleExitMultiSelect = useCallback(() => {
    setIsMultiSelectMode(false)
    setSelectedIds(new Set())
  }, [])

  // 全选
  // 注：musics 为当前可见完整列表，全选仅作用于可见项
  const handleSelectAll = useCallback(() => {
    const allIds = new Set(musics.map(m => m.id))
    setSelectedIds(allIds)
  }, [musics])

  // 批量添加到歌单
  const handleBatchAddToSonglist = useCallback(() => {
    if (selectedList.length === 0) return
    musicMultiAddSonglistModalRef.current?.show({
      selectedList,
      listId: LIST_IDS.TEMP,
    })
  }, [selectedList])

  const renderItem = useCallback(
    ({ item }: { item: LX.Music.MusicInfoLocal }) => (
      <ListItem
        musicInfo={item}
        listWidth={listWidth}
        onPlay={handlePlay}
        onShowMenu={handleShowMenu}
        isSelected={selectedIds.has(item.id)}
        isMultiSelectMode={isMultiSelectMode}
        onSelect={handleSelect}
        onLongPress={handleLongPress}
      />
    ),
    [listWidth, handlePlay, handleShowMenu, selectedIds, isMultiSelectMode, handleSelect, handleLongPress],
  )

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      {/* 排序按钮 */}
      <View style={styles.sortBar}>
        <TouchableOpacity onPress={() => setShowSortMenu(true)} style={styles.sortBtn}>
          <Icon name="list-order" size={16} color={theme['c-font']} />
          <Text size={13} color={theme['c-font']} style={{ marginLeft: 4 }}>
            {sortField === 'name'
              ? sortOrder === 'asc' ? '歌名 ↑' : '歌名 ↓'
              : sortOrder === 'asc' ? '时间 ↑' : '时间 ↓'}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={sortedMusics}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        windowSize={10}
        removeClippedSubviews={true}
      />

      {/* 多选操作条：absolute 定位在容器底部，紧贴播放栏上方 */}
      {isMultiSelectMode && (
        <View style={styles.multiSelectBar}>
          <TouchableOpacity onPress={handleSelectAll}>
            <Text size={14} color={theme['c-button-font']}>{t('list_select_all')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBatchAddToSonglist}>
            <Text size={14} color={theme['c-button-font']}>{t('add_to_songlist')} ({selectedIds.size})</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExitMultiSelect}>
            <Text size={14} color={theme['c-button-font']}>{t('list_select_cancel')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ListMenu ref={listMenuRef} />
      <MusicMultiAddSonglistModal ref={musicMultiAddSonglistModalRef} onAdded={handleExitMultiSelect} />

      {/* 排序菜单 */}
      {showSortMenu && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowSortMenu(false)}>
          <TouchableOpacity style={styles.sortMenu} activeOpacity={1}>
            {([
              { field: 'name' as SortField, order: 'asc' as SortOrder, label: '按歌名升序' },
              { field: 'name' as SortField, order: 'desc' as SortOrder, label: '按歌名降序' },
              { field: 'lastModified' as SortField, order: 'asc' as SortOrder, label: '按修改时间升序' },
              { field: 'lastModified' as SortField, order: 'desc' as SortOrder, label: '按修改时间降序' },
            ]).map(option => (
              <TouchableOpacity
                key={`${option.field}_${option.order}`}
                style={styles.sortMenuItem}
                onPress={() => handleSortChange(option.field, option.order)}
              >
                <Icon
                  name={sortField === option.field && sortOrder === option.order ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={18}
                  color={theme['c-font']}
                />
                <Text style={styles.sortMenuItemText} size={14} color={theme['c-font']}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = createStyle({
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 6,
    paddingBottom: 6,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  multiSelectBar: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderTopWidth: BorderWidths.normal,
    borderTopColor: 'rgba(128,128,128,0.3)',
    zIndex: 10,
    elevation: 10,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortMenu: {
    width: 200,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 8,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sortMenuItemText: {
    marginLeft: 12,
  },
})
