import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, StyleSheet, TouchableOpacity, View, type FlatListProps } from 'react-native'
import { useMySonglists } from '@/store/list/hook'
import { usePlayMusicInfo } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import { getData, saveData } from '@/plugins/storage'
import { useLayout } from '@/utils/hooks'
import { scaleSizeW } from '@/utils/pixelRatio'
import ListItem from './ListItem'
import { type SelectInfo } from './ListMenu'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'

type FlatListType = FlatListProps<LX.List.UserListInfo>

type SortField = 'createTime' | 'star'
type SortOrder = 'asc' | 'desc'

const SORT_FIELD_KEY = '@mysonglist_sort_field'
const SORT_ORDER_KEY = '@mysonglist_sort_order'

const GAP = scaleSizeW(20)

const SORT_OPTIONS: { label: string; field: SortField; order: SortOrder }[] = [
  { label: '按创建日期 ↓', field: 'createTime', order: 'desc' },
  { label: '按创建日期 ↑', field: 'createTime', order: 'asc' },
  { label: '按星级 ↓', field: 'star', order: 'desc' },
  { label: '按星级 ↑', field: 'star', order: 'asc' },
]

function getCreateTime(listId: string): number {
  if (listId.startsWith('mysonglist_')) {
    return parseInt(listId.replace('mysonglist_', ''), 10) || 0
  }
  return 0
}

export default ({ onShowMenu, onPress }: {
  onShowMenu: (info: SelectInfo, position: { x: number, y: number, w: number, h: number }) => void
  onPress: (item: LX.List.UserListInfo, index: number) => void
}) => {
  const lists = useMySonglists()
  const playMusicInfo = usePlayMusicInfo()
  const { onLayout, width } = useLayout()
  const t = useI18n()
  const theme = useTheme()

  // Sorting state (tasks 2.1-2.2)
  const [sortField, setSortField] = useState<SortField>('createTime')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [showSortMenu, setShowSortMenu] = useState(false)

  // Load persisted sort preference
  useEffect(() => {
    void (async () => {
      const [savedField, savedOrder] = await Promise.all([
        getData<SortField>(SORT_FIELD_KEY),
        getData<SortOrder>(SORT_ORDER_KEY),
      ])
      if (savedField) setSortField(savedField)
      if (savedOrder) setSortOrder(savedOrder)
    })()
  }, [])

  // Handle sort change (task 2.3)
  const handleSortChange = useCallback((field: SortField, order: SortOrder) => {
    setSortField(field)
    setSortOrder(order)
    void saveData(SORT_FIELD_KEY, field)
    void saveData(SORT_ORDER_KEY, order)
    setShowSortMenu(false)
  }, [])

  // Sorted list (task 2.4)
  const sortedLists = useMemo(() => {
    const sorted = [...lists]
    sorted.sort((a, b) => {
      let cmp = 0
      if (sortField === 'createTime') {
        cmp = getCreateTime(a.id) - getCreateTime(b.id)
      } else {
        cmp = (a.star ?? 0) - (b.star ?? 0)
      }
      return sortOrder === 'desc' ? -cmp : cmp
    })
    return sorted
  }, [lists, sortField, sortOrder])

  const rowInfo = (() => {
    const num = 2
    return {
      num,
      width: (width - GAP) / num,
    }
  })()

  const handleShowMenu = (item: LX.List.UserListInfo, index: number, moreButtonRef: any) => {
    if (moreButtonRef?.measure) {
      moreButtonRef.measure((fx: number, fy: number, w: number, h: number, px: number, py: number) => {
        onShowMenu({ listInfo: item, index }, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(w), h: Math.ceil(h) })
      })
    }
  }

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => (
    <ListItem
      item={item}
      index={index}
      width={rowInfo.width}
      onShowMenu={handleShowMenu}
      onPress={onPress}
      isPlaying={playMusicInfo.listId === item.id}
    />
  )

  const getkey: FlatListType['keyExtractor'] = item => item.id

  if (lists.length === 0) {
    return (
      <View style={styles.emptyContainer} onLayout={onLayout}>
        <Text color={theme['c-font-label']}>{t('my_songlist_empty')}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.toolbar}>
        <Text size={13} color={theme['c-font-label']} style={styles.sortLabel}>
          {sortField === 'createTime'
            ? '按创建日期'
            : '按星级'}
          {' '}{sortOrder === 'desc' ? '↓' : '↑'}
        </Text>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSortMenu(v => !v)}>
          <Icon name="list-order" size={18} color={theme['c-font-label']} />
        </TouchableOpacity>
      </View>
      {width == 0 ? null : (
        <FlatList
          style={styles.list}
          numColumns={rowInfo.num}
          columnWrapperStyle={{ justifyContent: 'space-evenly' }}
          data={sortedLists}
          renderItem={renderItem}
          keyExtractor={getkey}
          maxToRenderPerBatch={4}
          windowSize={8}
          removeClippedSubviews={true}
        />
      )}
      {showSortMenu && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowSortMenu(false)}>
          <View style={styles.menu}>
            {SORT_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={styles.menuItem}
                onPress={() => handleSortChange(opt.field, opt.order)}
              >
                <Icon
                  name={sortField === opt.field && sortOrder === opt.order ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={20}
                  color={theme['c-primary']}
                />
                <Text style={styles.menuText} size={14}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sortLabel: {
    marginRight: 4,
    alignSelf: 'center',
  },
  sortBtn: {
    padding: 6,
  },
  list: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menu: {
    marginTop: 4,
    marginRight: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 160,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuText: {
    marginLeft: 10,
  },
})
