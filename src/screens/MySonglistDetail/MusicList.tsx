/**
 * 本组件仅渲染歌曲列表，Header 由父组件 index.tsx 统一渲染，避免重复。
 * 注意：不要在 OnlineList 的 ListHeaderComponent 中传入 Header。
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { View, FlatList, type FlatListProps } from 'react-native'
import { getListMusics } from '@/core/list'
import { createStyle, getRowInfo } from '@/utils/tools'
import ListItem from '@/screens/Home/Views/Mylist/MusicList/ListItem'
import ListMenu, { type SelectInfo, type ListMenuType } from '@/screens/Home/Views/Mylist/MusicList/ListMenu'
import MusicPositionModal, { type MusicPositionModalType } from '@/screens/Home/Views/Mylist/MusicList/MusicPositionModal'
import ListMusicAdd, { type MusicAddModalType } from '@/components/MusicAddModal'
import ListMusicMultiAdd, { type MusicMultiAddModalType } from '@/components/MusicMultiAddModal'
import ActiveList, { type ActiveListType } from '@/screens/Home/Views/Mylist/MusicList/ActiveList'
import MultipleModeBar, { type MultipleModeBarType } from '@/screens/Home/Views/Mylist/MusicList/MultipleModeBar'
import { handlePlay, handleRemove, handleReorder } from './listAction'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { usePlayMusicInfo, usePlayInfo } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'

type FlatListType = FlatListProps<LX.Music.MusicInfo>

export interface MusicListProps {
  componentId: string
  listId: string
}

export interface MusicListType {
  loadList: (listId: string) => void
}

export default forwardRef<MusicListType, MusicListProps>(({ componentId, listId }, ref) => {
  const listRef = useRef<FlatList>(null)
  const listMenuRef = useRef<ListMenuType>(null)
  const musicPositionModalRef = useRef<MusicPositionModalType>(null)
  const listMusicAddRef = useRef<MusicAddModalType>(null)
  const listMusicMultiAddRef = useRef<MusicMultiAddModalType>(null)
  const activeListRef = useRef<ActiveListType>(null)
  const multipleModeBarRef = useRef<MultipleModeBarType>(null)
  const isMultiSelectMode = useRef(false)
  const selectedListRef = useRef<LX.Music.MusicInfo[]>([])
  const [musics, setMusics] = useState<LX.Music.MusicInfo[]>([])
  const theme = useTheme()
  const t = useI18n()
  const isShowAlbumName = useSettingValue('list.isShowAlbumName')
  const isShowInterval = useSettingValue('list.isShowInterval')

  useImperativeHandle(ref, () => ({
    loadList(id: string) {
      void loadList(id)
    },
  }))

  useEffect(() => {
    void loadList(listId)

    const handleChange = (ids: string[]) => {
      if (!ids.includes(listId)) return
      void loadList(listId)
    }

    global.app_event.on('myListMusicUpdate', handleChange)
    return () => {
      global.app_event.off('myListMusicUpdate', handleChange)
    }
  }, [listId])

  const loadList = async (id: string) => {
    const list = await getListMusics(id)
    setMusics([...list]) // 创建新数组，触发 React 重渲染
  }

  const handlePlayList = useCallback((item: LX.Music.MusicInfo, index: number) => {
    void handlePlay(listId, index)
  }, [listId])

  const handleLongPress = useCallback((item: LX.Music.MusicInfo, index: number) => {
    musicPositionModalRef.current?.show({
      musicInfo: item,
      selectedList: selectedListRef.current,
      index,
      listId,
      single: selectedListRef.current.length === 0,
    })
  }, [listId])

  const showMenu = useCallback((musicInfo: LX.Music.MusicInfo, index: number, position: { x: number, y: number, w: number, h: number }) => {
    listMenuRef.current?.show({
      musicInfo,
      index,
      listId,
      single: false,
      selectedList: selectedListRef.current,
    }, position)
  }, [listId])

  const handleUpdatePosition = useCallback(async (info: SelectInfo, position: number) => {
    if (position < 0) return
    const ids = info.selectedList.length
      ? info.selectedList.map(m => m.id)
      : [info.musicInfo.id]
    await handleReorder(info.listId, position, ids)
  }, [])

  const hancelExitSelect = useCallback(() => {
    activeListRef.current?.setVisibleBar(true)
    isMultiSelectMode.current = false
  }, [])

  // 订阅播放器状态事件，实时更新播放指示
  const playMusicInfo = usePlayMusicInfo()
  const playInfo = usePlayInfo()
  // listId 是导航传入的固定值，在组件生命周期内不会变化
  const activeIndex = useMemo(() => {
    return playMusicInfo.listId === listId ? playInfo.playIndex : -1
  }, [listId, playInfo.playIndex, playMusicInfo.listId])

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => (
    <ListItem
      item={item}
      index={index}
      activeIndex={activeIndex}
      onPress={handlePlayList}
      onLongPress={handleLongPress}
      onShowMenu={showMenu}
      selectedList={selectedListRef.current}
      rowInfo={{ rowNum: undefined, rowWidth: '100%' }}
      isShowAlbumName={isShowAlbumName}
      isShowInterval={isShowInterval}
    />
  )

  const getkey: FlatListType['keyExtractor'] = item => item.id

  if (musics.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text color={theme['c-font-label']}>{t('no_item')}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={{ zIndex: 2 }}>
        <ActiveList ref={activeListRef} onShowSearchBar={() => {}} onScrollToTop={() => {}} />
        <MultipleModeBar
          ref={multipleModeBarRef}
          onSwitchMode={() => {}}
          onSelectAll={() => {}}
          onExitSelectMode={hancelExitSelect}
        />
      </View>
      <View style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={musics}
          renderItem={renderItem}
          keyExtractor={getkey}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          extraData={activeIndex}
        />
      </View>
      <ListMenu
        ref={listMenuRef}
        onPlay={(info) => { void handlePlay(info.listId, info.index) }}
        onPlayLater={() => {}}
        onRemove={(info) => { void handleRemove(info.listId, [info.musicInfo]) }}
        onCopyName={() => {}}
        onMusicSourceDetail={() => {}}
        onAdd={() => {}}
        onMove={() => {}}
        onEditMetadata={() => {}}
        onChangePosition={(info) => musicPositionModalRef.current?.show(info)}
        onToggleSource={() => {}}
        onDislikeMusic={() => {}}
      />
      <MusicPositionModal
        ref={musicPositionModalRef}
        onUpdatePosition={handleUpdatePosition}
      />
      <ListMusicAdd ref={listMusicAddRef} onAdded={() => {}} />
      <ListMusicMultiAdd ref={listMusicMultiAddRef} onAdded={() => {}} />
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
