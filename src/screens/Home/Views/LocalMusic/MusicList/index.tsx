import { useCallback, useMemo, useRef, useState } from 'react'
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
import { BorderWidths } from '@/theme'
import playerState from '@/store/player/state'

const ITEM_HEIGHT = 54

type MusicListProps = {
  musics: LX.Music.MusicInfoLocal[]
}

export default ({ musics }: MusicListProps) => {
  const t = useI18n()
  const theme = useTheme()
  const listMenuRef = useRef<ListMenuType>(null)
  const musicMultiAddSonglistModalRef = useRef<MusicMultiAddSonglistModalType>(null)
  const [listWidth, setListWidth] = useState(300)

  // 多选状态管理
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  // 使用 musicInfo.id 作为选中标识，弃用 index
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  // 已选列表通过 useMemo 派生
  const selectedList = useMemo(
    () => musics.filter(m => selectedIds.has(m.id)),
    [musics, selectedIds]
  )

  // 当前正在播放的歌曲索引（本地音乐对应 LIST_IDS.TEMP）
  const activeIndex = musics.findIndex(m => {
    return playerState.playMusicInfo.listId === LIST_IDS.TEMP && playerState.playMusicInfo.musicInfo?.id === m.id
  })

  const handleLayout = useCallback((e: any) => {
    setListWidth(e.nativeEvent.layout.width)
  }, [])

  const handlePlay = useCallback(async (index: number) => {
    await playList(LIST_IDS.TEMP, index)
  }, [])

  const handleShowMenu = useCallback(
    (musicInfo: LX.Music.MusicInfoLocal, index: number) => {
      listMenuRef.current?.show({
        musicInfo,
        index,
      })
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
    ({ item, index }: { item: LX.Music.MusicInfoLocal; index: number }) => (
      <ListItem
        musicInfo={item}
        index={index}
        activeIndex={activeIndex}
        listWidth={listWidth}
        onPlay={handlePlay}
        onShowMenu={handleShowMenu}
        isSelected={selectedIds.has(item.id)}
        isMultiSelectMode={isMultiSelectMode}
        onSelect={handleSelect}
        onLongPress={handleLongPress}
      />
    ),
    [listWidth, handlePlay, handleShowMenu, selectedIds, isMultiSelectMode, handleSelect, handleLongPress, activeIndex],
  )

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      <FlatList
        data={musics}
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
    </View>
  )
}

const styles = createStyle({
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
})
