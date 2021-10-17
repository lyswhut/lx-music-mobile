import React, { useState, useCallback, memo, useMemo, useRef, useEffect } from 'react'
import { StyleSheet, FlatList, View, RefreshControl } from 'react-native'
import { useGetter, useDispatch } from '@/store'
import Menu from '@/components/common/Menu'
import MusicAddModal from '@/components/MusicAddModal'
import MusicMultiAddModal from '@/components/MusicMultiAddModal'
import ListItem from './ListItem'
import ExitMultipleModeBar from './ExitMultipleModeBar'
import LoadingMask from '@/components/common/LoadingMask'
import { useTranslation } from '@/plugins/i18n'
import { Loading as FooterLoading, End as FooterEnd } from './Footer'
import { LIST_ID_PLAY_LATER } from '@/config/constant'

export default memo(({
  list,
  isEnd,
  page,
  isListRefreshing,
  // visibleLoadingMask,
  onRefresh,
  onLoadMore,
  isLoading,
  progressViewOffset,
  ListHeaderComponent,
}) => {
  const defaultList = useGetter('list', 'defaultList')
  const defaultListRef = useRef(defaultList)
  const addMusicToList = useDispatch('list', 'listAdd')
  const setPlayList = useDispatch('player', 'setList')
  const setTempPlayList = useDispatch('player', 'setTempPlayList')
  const [buttonPosition, setButtonPosition] = useState({ w: 0, h: 0, x: 0, y: 0 })
  const selectedData = useRef({ data: null, index: -1 })
  const [visibleMenu, setVisibleMenu] = useState(false)
  const [visibleLoadingMask, setVisibleLoadingMask] = useState(false)
  const flatListRef = useRef()
  const { t } = useTranslation()
  const [visibleMusicAddModal, setVisibleMusicAddModal] = useState(false)
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const isMultiSelectModeRef = useRef(isMultiSelectMode)
  const [selectedList, setSelectedList] = useState([])
  const selectedListRef = useRef([])
  const [visibleMusicMultiAddModal, setVisibleMusicMultiAddModal] = useState(false)
  const listRef = useRef([])
  const [selectMode, setSelectMode] = useState('single')
  const selectModeRef = useRef('single')
  const prevSelectIndexRef = useRef(-1)
  const addMultiMusicToList = useDispatch('list', 'listAddMultiple')
  const theme = useGetter('common', 'theme')

  useEffect(() => {
    defaultListRef.current = defaultList
  }, [defaultList])
  useEffect(() => {
    listRef.current = list
  }, [list])

  const handlePlay = useCallback((targetSong, index) => {
    addMusicToList({
      musicInfo: targetSong,
      id: defaultListRef.current.id,
    })

    const targetIndex = defaultListRef.current.list.findIndex(s => s.songmid === targetSong.songmid)
    if (targetIndex > -1) {
      setPlayList({
        list: defaultListRef.current,
        index: targetIndex,
      })
    }
  }, [addMusicToList, setPlayList])

  const handleSelect = useCallback((item, index) => {
    if (selectModeRef.current == 'single') {
      const index = selectedListRef.current.indexOf(item)
      if (index < 0) {
        selectedListRef.current.push(item)
        // setSelectedItem({ item, isChecked: true })
      } else {
        selectedListRef.current.splice(index, 1)
        // setSelectedItem({ item, isChecked: false })
      }
    } else {
      if (selectedListRef.current.length) {
        const prevIndex = prevSelectIndexRef.current
        const currentIndex = index
        if (prevIndex == currentIndex) {
          selectedListRef.current = []
        } else if (currentIndex > prevIndex) {
          selectedListRef.current = listRef.current.slice(prevIndex, currentIndex + 1)
        } else {
          selectedListRef.current = listRef.current.slice(currentIndex, prevIndex + 1)
          selectedListRef.current.reverse()
        }
      } else {
        selectedListRef.current.push(item)
        prevSelectIndexRef.current = index
      }
    }
    setSelectedList([...selectedListRef.current])
  }, [])
  const handleSelectAll = useCallback(() => {
    if (!listRef.current.length) return
    if (selectedListRef.current.length == listRef.current.length) {
      selectedListRef.current = []
    } else {
      selectedListRef.current = [...listRef.current]
    }
    setSelectedList([...selectedListRef.current])
  }, [])

  const handleSetSelectMode = useCallback(mode => {
    setSelectMode(mode)
    selectModeRef.current = mode
    if (mode == 'range' && selectedListRef.current.length) {
      prevSelectIndexRef.current = listRef.current.indexOf(selectedListRef.current[selectedListRef.current.length - 1])
    }
  }, [])

  const handleCancelMultiSelect = useCallback(() => {
    setIsMultiSelectMode(false)
    isMultiSelectModeRef.current = false
    selectedListRef.current = []
    setSelectedList([])
  }, [])
  const handlePress = useCallback((item, index) => {
    if (isMultiSelectModeRef.current) {
      handleSelect(item, index)
    } else {
      handlePlay(item, index)
    }
  }, [handlePlay, handleSelect])

  const handleLongPress = useCallback((item, index) => {
    setIsMultiSelectMode(true)
    isMultiSelectModeRef.current = true
    handleSelect(item, index)
  }, [handleSelect])

  const menus = useMemo(() => {
    return [
      { action: 'play', label: t('play') },
      { action: 'playLater', label: t('play_later') },
      // { action: 'copyName', label: t('copy_name') },
      // { action: 'download', label: '下载' },
      // { action: 'add', label: '添加到...' },
      // { action: 'move', label: '移动到...' },
      { action: 'add', label: t('add_to') },
    ]
  }, [t])
  const showMenu = useCallback((item, index, position) => {
    setButtonPosition({ ...position })
    selectedData.current.data = item
    selectedData.current.index = index
    setVisibleMenu(true)
  }, [setButtonPosition])
  const hideMenu = useCallback(() => {
    setVisibleMenu(false)
  }, [setVisibleMenu])
  const handleMenuPress = useCallback(({ action }) => {
    switch (action) {
      case 'play':
        if (selectedListRef.current.length) {
          addMultiMusicToList({ id: 'default', list: [...selectedListRef.current] })
          handleCancelMultiSelect()
        }
        handlePlay(selectedData.current.data, selectedData.current.index)
        break
      case 'playLater':
        if (selectedListRef.current.length) {
          setTempPlayList(selectedListRef.current.map(s => ({ listId: LIST_ID_PLAY_LATER, musicInfo: s })))
          handleCancelMultiSelect()
        } else {
          setTempPlayList([{ listId: LIST_ID_PLAY_LATER, musicInfo: selectedData.current.data }])
        }
        break
        // case 'copyName':
        //   break
      case 'add':
        // console.log(selectedListRef.current.length)
        selectedListRef.current.length
          ? setVisibleMusicMultiAddModal(true)
          : setVisibleMusicAddModal(true)
        break
      default:
        break
    }
  }, [addMultiMusicToList, handleCancelMultiSelect, handlePlay, setTempPlayList])

  useEffect(() => {
    if (isLoading && page == 1) {
      setVisibleLoadingMask(true)
    } else {
      setVisibleLoadingMask(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  useEffect(() => {
    if (!flatListRef.current) return
    if (page == 1) flatListRef.current.scrollToOffset({ offset: 0, animated: true })
  }, [list, page])

  const hideMusicAddModal = useCallback(() => {
    setVisibleMusicAddModal(false)
  }, [])

  const hideMusicMultiAddModal = useCallback(() => {
    setVisibleMusicMultiAddModal(false)
  }, [])

  const loadingMaskmomponent = useMemo(() => (
    <LoadingMask visible={visibleLoadingMask} />
  ), [visibleLoadingMask])
  const exitMultipleModeBtn = useMemo(() => (
    <ExitMultipleModeBar
      multipleMode={isMultiSelectMode}
      onCancel={handleCancelMultiSelect}
      onSwitchMode={handleSetSelectMode}
      onSelectAll={handleSelectAll}
      selectMode={selectMode}
      isSelectAll={selectedList.length && list.length == selectedList.length} />
  ), [handleCancelMultiSelect, handleSelectAll, handleSetSelectMode, isMultiSelectMode, list, selectMode, selectedList])

  const renderItem = useCallback(({ item, index }) => (
    <ListItem
      item={item}
      index={index}
      onPress={handlePress}
      showMenu={showMenu}
      selectedList={selectedList}
      handleLongPress={handleLongPress} />
  ), [handleLongPress, handlePress, selectedList, showMenu])

  const refreshControl = useMemo(() => (
    <RefreshControl
      colors={[theme.secondary]}
      progressBackgroundColor={theme.primary}
      refreshing={isListRefreshing}
      onRefresh={onRefresh} />
  ), [isListRefreshing, onRefresh, theme])

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        style={styles.list}
        keyboardShouldPersistTaps={'always'}
        data={list}
        renderItem={renderItem}
        keyExtractor={item => item.songmid.toString()}
        onRefresh={onRefresh}
        refreshing={isListRefreshing}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={80}
        windowSize={18}
        removeClippedSubviews={true}
        initialNumToRender={15}
        onEndReached={onLoadMore}
        progressViewOffset={progressViewOffset}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={refreshControl}
        ListFooterComponent={<View style={{ paddingBottom: isMultiSelectMode ? 40 : 0 }}>{isLoading ? <FooterLoading /> : isEnd ? <FooterEnd /> : null}</View>}
      />
      { exitMultipleModeBtn }
      <Menu
        menus={menus}
        buttonPosition={buttonPosition}
        onPress={handleMenuPress}
        visible={visibleMenu}
        hideMenu={hideMenu} />
      <MusicAddModal
        visible={visibleMusicAddModal}
        hideModal={hideMusicAddModal}
        musicInfo={selectedData.current.data} />
      <MusicMultiAddModal
        visible={visibleMusicMultiAddModal}
        hideModal={hideMusicMultiAddModal}
        list={selectedListRef.current}
        onAdd={handleCancelMultiSelect} />
      { loadingMaskmomponent }
    </View>
  )
})


const styles = StyleSheet.create({
  list: {
    flex: 1,
    overflow: 'hidden',
  },
  exitMultipleModeBtn: {
    height: 40,
  },
})

