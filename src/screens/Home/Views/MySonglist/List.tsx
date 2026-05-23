import { useRef } from 'react'
import { FlatList, View, type FlatListProps } from 'react-native'
import { useMySonglists } from '@/store/list/hook'
import { usePlayMusicInfo } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import { useLayout } from '@/utils/hooks'
import { scaleSizeW } from '@/utils/pixelRatio'
import ListItem from './ListItem'
import { type SelectInfo } from './ListMenu'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'

type FlatListType = FlatListProps<LX.List.UserListInfo>

const GAP = scaleSizeW(20)

export default ({ onShowMenu, onPress }: {
  onShowMenu: (info: SelectInfo, position: { x: number, y: number, w: number, h: number }) => void
  onPress: (item: LX.List.UserListInfo, index: number) => void
}) => {
  const lists = useMySonglists()
  const playMusicInfo = usePlayMusicInfo()
  const { onLayout, width } = useLayout()
  const t = useI18n()
  const theme = useTheme()

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
      {width == 0 ? null : (
        <FlatList
          style={styles.list}
          numColumns={rowInfo.num}
          columnWrapperStyle={{ justifyContent: 'space-evenly' }}
          data={lists}
          renderItem={renderItem}
          keyExtractor={getkey}
          maxToRenderPerBatch={4}
          windowSize={8}
          removeClippedSubviews={true}
        />
      )}
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    overflow: 'hidden',
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
})
