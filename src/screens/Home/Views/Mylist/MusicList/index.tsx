import { useCallback, useRef, useState } from 'react'

import listState from '@/store/list/state'
import ListMenu, { type ListMenuType, type Position, type SelectInfo } from './ListMenu'
import { clearMusicUrl, handleDislikeMusic, handlePlay, handlePlayLater, handleRemove, handleShare, handleShowMusicSourceDetail, handleUpdateMusicInfo, handleUpdateMusicPosition } from './listAction'
import List, { type ListType } from './List'
import ListMusicAdd, { type MusicAddModalType as ListMusicAddType } from '@/components/MusicAddModal'
import ListMusicMultiAdd, { type MusicMultiAddModalType as ListAddMultiType } from '@/components/MusicMultiAddModal'
import { createStyle } from '@/utils/tools'
import { type LayoutChangeEvent, View } from 'react-native'
import HorizontalListSelector from './HorizontalListSelector'
import MultipleModeBar, { type SelectMode, type MultipleModeBarType } from './MultipleModeBar'
import ListMusicSearch, { type ListMusicSearchType } from './ListMusicSearch'
import MusicPositionModal, { type MusicPositionModalType } from './MusicPositionModal'
import MetadataEditModal, { type MetadataEditType, type MetadataEditProps } from '@/components/MetadataEditModal'
import MusicToggleModal, { type MusicToggleModalType } from './MusicToggleModal'
import { useTheme } from '@/store/theme/hook'
import Input, { type InputType } from '@/components/common/Input'


export default () => {
  const listMusicSearchRef = useRef<ListMusicSearchType>(null)
  const listRef = useRef<ListType>(null)
  const multipleModeBarRef = useRef<MultipleModeBarType>(null)
  const listMusicAddRef = useRef<ListMusicAddType>(null)
  const listMusicMultiAddRef = useRef<ListAddMultiType>(null)
  const musicPositionModalRef = useRef<MusicPositionModalType>(null)
  const metadataEditTypeRef = useRef<MetadataEditType>(null)
  const listMenuRef = useRef<ListMenuType>(null)
  const musicToggleModalRef = useRef<MusicToggleModalType>(null)
  const layoutHeightRef = useRef<number>(0)
  const isShowMultipleModeBar = useRef(false)
  const selectedInfoRef = useRef<SelectInfo>()
  const theme = useTheme()
  const searchInputRef = useRef<InputType>(null)
  const [keyword, setKeyword] = useState('')

  const hancelMultiSelect = useCallback(() => {
    if (keyword.trim()) {
      multipleModeBarRef.current?.setVisibleBar(false)
    }
    isShowMultipleModeBar.current = true
    multipleModeBarRef.current?.show()
    listRef.current?.setIsMultiSelectMode(true)
  }, [keyword])
  const hancelExitSelect = useCallback(() => {
    if (keyword.trim()) {
      multipleModeBarRef.current?.setVisibleBar(true)
    }
    multipleModeBarRef.current?.exitSelectMode()
    listRef.current?.setIsMultiSelectMode(false)
    isShowMultipleModeBar.current = false
  }, [keyword])
  const hancelSwitchSelectMode = useCallback((mode: SelectMode) => {
    multipleModeBarRef.current?.setSwitchMode(mode)
    listRef.current?.setSelectMode(mode)
  }, [])
  const hancelScrollToTop = useCallback(() => {
    listRef.current?.scrollToTop()
  }, [])

  const showMenu = useCallback((musicInfo: LX.Music.MusicInfo, index: number, position: Position) => {
    listMenuRef.current?.show({
      musicInfo,
      index,
      listId: listState.activeListId,
      single: false,
      selectedList: listRef.current!.getSelectedList(),
    }, position)
  }, [])
  const handleSearch = useCallback((text: string) => {
    setKeyword(text)
    listMusicSearchRef.current?.search(text.trim(), layoutHeightRef.current)
  }, [])
  const handleScrollToInfo = useCallback((info: LX.Music.MusicInfo) => {
    listRef.current?.scrollToInfo(info)
  }, [])
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    layoutHeightRef.current = e.nativeEvent.layout.height
  }, [])

  const handleAddMusic = useCallback((info: SelectInfo) => {
    if (info.selectedList.length) {
      listMusicMultiAddRef.current?.show({ selectedList: info.selectedList, listId: info.listId, isMove: false })
    } else {
      listMusicAddRef.current?.show({ musicInfo: info.musicInfo, listId: info.listId, isMove: false })
    }
  }, [])
  const handleMoveMusic = useCallback((info: SelectInfo) => {
    if (info.selectedList.length) {
      listMusicMultiAddRef.current?.show({ selectedList: info.selectedList, listId: info.listId, isMove: true })
    } else {
      listMusicAddRef.current?.show({ musicInfo: info.musicInfo, listId: info.listId, isMove: true })
    }
  }, [])
  const handleEditMetadata = useCallback((info: SelectInfo) => {
    if (info.musicInfo.source != 'local') return
    selectedInfoRef.current = info
    metadataEditTypeRef.current?.show(info.musicInfo.meta.filePath)
  }, [])
  const handleUpdateMetadata = useCallback<MetadataEditProps['onUpdate']>((info) => {
    if (!selectedInfoRef.current || selectedInfoRef.current.musicInfo.source != 'local') return
    handleUpdateMusicInfo(selectedInfoRef.current.listId, selectedInfoRef.current.musicInfo, info)
  }, [])


  return (
    <View style={styles.container}>
      <View style={{ zIndex: 2 }}>
        <HorizontalListSelector />
        <View style={styles.searchBar}>
          <View style={{ ...styles.searchInputWrapper, backgroundColor: theme['c-primary-background'] }}>
            <Input
              ref={searchInputRef}
              placeholder="Search for something..."
              value={keyword}
              onChangeText={handleSearch}
              style={styles.searchInput}
              clearBtn
            />
          </View>
        </View>
        <MultipleModeBar
          ref={multipleModeBarRef}
          onSwitchMode={hancelSwitchSelectMode}
          onSelectAll={isAll => listRef.current?.selectAll(isAll)}
          onExitSelectMode={hancelExitSelect}
        />
      </View>
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <List
          ref={listRef}
          onShowMenu={showMenu}
          onMuiltSelectMode={hancelMultiSelect}
          onSelectAll={isAll => multipleModeBarRef.current?.setIsSelectAll(isAll)}
        />
        <ListMusicSearch
          ref={listMusicSearchRef}
          onScrollToInfo={handleScrollToInfo}
        />
      </View>
      <ListMusicAdd ref={listMusicAddRef} onAdded={hancelExitSelect} />
      <ListMusicMultiAdd ref={listMusicMultiAddRef} onAdded={hancelExitSelect} />
      <MusicPositionModal ref={musicPositionModalRef}
        onUpdatePosition={(info, postion) => { handleUpdateMusicPosition(postion, info.listId, info.musicInfo, info.selectedList, hancelExitSelect) }} />
      <ListMenu
        ref={listMenuRef}
        onPlay={info => { handlePlay(info.listId, info.index) }}
        onPlayLater={info => { hancelExitSelect(); handlePlayLater(info.listId, info.musicInfo, info.selectedList, hancelExitSelect) }}
        onRemove={info => { hancelExitSelect(); handleRemove(info.listId, info.musicInfo, info.selectedList, hancelExitSelect) }}
        onDislikeMusic={info => { void handleDislikeMusic(info.musicInfo) }}
        onCopyName={info => { handleShare(info.musicInfo) }}
        onMusicSourceDetail={info => { void handleShowMusicSourceDetail(info.musicInfo) }}
        onAdd={handleAddMusic}
        onMove={handleMoveMusic}
        onEditMetadata={handleEditMetadata}
        onChangePosition={info => musicPositionModalRef.current?.show(info)}
        onToggleSource={info => musicToggleModalRef.current?.show(info)}
        onRemoveCache={info => { void clearMusicUrl(info.musicInfo) }}
      />
      <MetadataEditModal
        ref={metadataEditTypeRef}
        onUpdate={handleUpdateMetadata}
      />
      <MusicToggleModal ref={musicToggleModalRef} />
    </View>
  )
}


const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  searchBar: {
    height: 36,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    borderRadius: 0,
    height: '100%',
    flexGrow: 1,
    flexShrink: 1,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    alignItems: 'center',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 5,
    height: 32,
  },
})