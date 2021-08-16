import React, { useMemo, useCallback, memo, useRef, useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'

import { useGetter, useDispatch } from '@/store'
import Menu from '@/components/common/Menu'
import MusicAddModal from '@/components/MusicAddModal'
import MusicMultiAddModal from '@/components/MusicMultiAddModal'
import ExitMultipleModeBar from './components/ExitMultipleModeBar'
import MyList from './components/MyList'
import ListItem from './components/ListItem'
import { getListScrollPosition, saveListScrollPosition, toast } from '@/utils/tools'
import { useTranslation } from '@/plugins/i18n'
import { LIST_ITEM_HEIGHT } from '@/config/constant'
import MusicPositionModal from './components/MusicPositionModal'
import { BorderWidths } from '@/theme'
// const shadow = {
//   shadowOffset: 2,
//   shadowOpacity: 0.23,
//   shadowRadius: 0,
//   elevation: 4,
// }


const List = () => {
  const allList = useGetter('list', 'allList')
  const isJumpPosition = useGetter('list', 'isJumpPosition')
  const playInfo = useGetter('player', 'playInfo')
  const playListInfo = useGetter('player', 'listInfo')
  const playListInfoRef = useRef(playListInfo)
  const activeListId = useGetter('common', 'prevSelectListId')
  const activeListIdRef = useRef(activeListId)
  const [buttonPosition, setButtonPosition] = useState({ w: 0, h: 0, x: 0, y: 0 })
  const selectedDataRef = useRef({ data: null, index: -1 })
  const flatListRef = useRef()
  const isMoveRef = useRef(false)
  const [visibleMenu, setVisibleMenu] = useState(false)
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const isMultiSelectModeRef = useRef(false)
  const [selectedList, setSelectedList] = useState([])
  const selectedListRef = useRef([])
  const [selectMode, setSelectMode] = useState('single')
  const selectModeRef = useRef('single')
  const prevSelectIndexRef = useRef(-1)
  const activeIndexRef = useRef(-1)
  const activeIndex = useMemo(() => {
    const index = playInfo.listId === activeListId ? playInfo.playIndex : -1
    activeIndexRef.current = index
    return index
  }, [playInfo.listId, activeListId, playInfo.playIndex])
  const currentListRef = useRef({})
  const currentList = useMemo(() => currentListRef.current = (allList.find(l => l.id == activeListId) || allList[0]), [allList, activeListId])
  const activeItemId = useMemo(() => currentList.list && activeIndex > -1 && currentList.list[activeIndex] ? String(currentList.list[activeIndex].songmid) : null, [currentList, activeIndex])
  const setPlayList = useDispatch('player', 'setList')
  const playMusic = useDispatch('player', 'playMusic')
  const setTempPlayList = useDispatch('player', 'setTempPlayList')
  const removeListItem = useDispatch('list', 'listRemove')
  const removeListMultiItem = useDispatch('list', 'listRemoveMultiple')
  const setJumpPosition = useDispatch('list', 'setJumpPosition')
  const { t } = useTranslation()
  const [visibleMusicAddModal, setVisibleMusicAddModal] = useState(false)
  const [visibleMusicMultiAddModal, setVisibleMusicMultiAddModal] = useState(false)
  const [visibleMusicPosition, setVIsibleMusicPosition] = useState(false)
  const setMusicPosition = useDispatch('list', 'setMusicPosition')
  const theme = useGetter('common', 'theme')

  useEffect(() => {
    activeListIdRef.current = activeListId
  }, [activeListId])
  useEffect(() => {
    playListInfoRef.current = playListInfo
  }, [playListInfo])

  const handlePlay = useCallback(async(data, index) => {
    if (playListInfoRef.current.id != activeListIdRef.current) {
      setPlayList({
        list: currentListRef.current,
        index,
      })
    } else {
      playMusic({
        musicInfo: data,
        listId: activeListIdRef.current,
      })
    }
  }, [setPlayList, playMusic])

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
          selectedListRef.current = currentListRef.current.list.slice(prevIndex, currentIndex + 1)
        } else {
          selectedListRef.current = currentListRef.current.list.slice(currentIndex, prevIndex + 1)
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
    if (!currentListRef.current.list.length) return
    if (selectedListRef.current.length == currentListRef.current.list.length) {
      selectedListRef.current = []
    } else {
      selectedListRef.current = [...currentListRef.current.list]
    }
    setSelectedList([...selectedListRef.current])
  }, [])

  const handleSetSelectMode = useCallback(mode => {
    setSelectMode(mode)
    selectModeRef.current = mode
    if (mode == 'range' && selectedListRef.current.length) {
      prevSelectIndexRef.current = currentListRef.current.list.indexOf(selectedListRef.current[selectedListRef.current.length - 1])
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
      // { action: 'add', label: t('add_to') },
      // { action: 'move', label: '移动到...' },
      // { action: 'download', label: '下载' },
      { action: 'add', label: t('add_to') },
      { action: 'move', label: t('move_to') },
      { action: 'changePosition', label: t('change_position') },
      // { action: 'move', label: '移动到...' },
      { action: 'remove', label: t('delete') },
    ]
  }, [t])

  const showMenu = useCallback((item, index, position) => {
    // console.log(position)
    setButtonPosition({ ...position })
    selectedDataRef.current.data = item
    selectedDataRef.current.index = index
    setVisibleMenu(true)
  }, [setButtonPosition])

  const hideMenu = useCallback(() => {
    setVisibleMenu(false)
  }, [setVisibleMenu])

  const handleMenuPress = useCallback(({ action }) => {
    switch (action) {
      case 'play':
        handlePlay(selectedDataRef.current.data, selectedDataRef.current.index)
        break
      case 'playLater':
        if (selectedListRef.current.length) {
          setTempPlayList(selectedListRef.current.map(s => ({ listId: activeListIdRef.current, musicInfo: s })))
          handleCancelMultiSelect()
        } else {
          setTempPlayList([{ listId: activeListIdRef.current, musicInfo: selectedDataRef.current.data }])
        }
        break
      // case 'copyName':
      //   break
      case 'add':
        isMoveRef.current = false
        selectedListRef.current.length
          ? setVisibleMusicMultiAddModal(true)
          : setVisibleMusicAddModal(true)
        break
      case 'move':
        isMoveRef.current = true
        selectedListRef.current.length
          ? setVisibleMusicMultiAddModal(true)
          : setVisibleMusicAddModal(true)
        break
      case 'changePosition':
        setVIsibleMusicPosition(true)
        break
      case 'remove':
        if (selectedListRef.current.length) {
          removeListMultiItem({ listId: activeListIdRef.current, ids: selectedListRef.current.map(s => s.songmid) })
          handleCancelMultiSelect()
        } else {
          removeListItem({ listId: activeListIdRef.current, id: selectedDataRef.current.data.songmid })
        }
        break
      default:
        break
    }
  }, [handleCancelMultiSelect, handlePlay, removeListItem, removeListMultiItem, setTempPlayList])

  const handleScroll = useCallback(({ nativeEvent }) => {
    saveListScrollPosition(currentListRef.current.id, nativeEvent.contentOffset.y)
  }, [])

  const hideMusicAddModal = useCallback(() => {
    setVisibleMusicAddModal(false)
  }, [])

  const hideMusicMultiAddModal = useCallback(() => {
    setVisibleMusicMultiAddModal(false)
  }, [])

  const jumpPosition = useCallback(() => {
    if (activeIndexRef.current < 0) return
    global.requestAnimationFrame(() => {
      flatListRef.current.scrollToIndex({ index: activeIndexRef.current, viewPosition: 0.3, animated: true })
      setJumpPosition(false)
    })
  }, [setJumpPosition])

  const hideMusicPositionModal = useCallback(() => {
    setVIsibleMusicPosition(false)
  }, [])
  const handleSetMusicPosition = useCallback(num => {
    num = Math.min(parseInt(num), currentListRef.current.list.length)
    setMusicPosition({
      id: activeListIdRef.current,
      position: num,
      list: selectedListRef.current.length ? [...selectedListRef.current] : [selectedDataRef.current.data],
    })
    setVIsibleMusicPosition(false)
    handleCancelMultiSelect()
  }, [handleCancelMultiSelect, setMusicPosition])

  useEffect(() => {
    const offset = getListScrollPosition(currentList.id)
    flatListRef.current.scrollToOffset({ offset, animated: false })
    // global.requestAnimationFrame(() => {
    //   flatListRef.current.scrollToOffset({ offset, animated: false })
    // })
  }, [currentList.id])
  useEffect(() => {
    if (!isJumpPosition) return
    jumpPosition()
  }, [isJumpPosition, jumpPosition])

  const renderItem = useCallback(({ item, index }) => (
    <ListItem
      item={item}
      index={index}
      activeIndex={activeIndex}
      onPress={handlePress}
      showMenu={showMenu}
      selectedList={selectedList}
      handleLongPress={handleLongPress} />
  ), [activeIndex, handleLongPress, handlePress, selectedList, showMenu])

  const listComponent = useMemo(() => (
    <FlatList
      ref={flatListRef}
      onScroll={handleScroll}
      style={styles.list}
      data={currentList.list}
      maxToRenderPerBatch={8}
      updateCellsBatchingPeriod={80}
      windowSize={18}
      removeClippedSubviews={true}
      initialNumToRender={12}
      renderItem={renderItem}
      keyExtractor={item => String(item.songmid)}
      extraData={activeItemId}
      getItemLayout={(data, index) => ({ length: LIST_ITEM_HEIGHT, offset: LIST_ITEM_HEIGHT * index, index })} />
  ), [activeItemId, currentList.list, handleScroll, renderItem])

  return (
    <View style={styles.container}>
      <View>
        <MyList currentList={currentList} activeListIdRef={activeListIdRef} handleCancelMultiSelect={handleCancelMultiSelect} />
        <ExitMultipleModeBar
          multipleMode={isMultiSelectMode}
          onCancel={handleCancelMultiSelect}
          onSwitchMode={handleSetSelectMode}
          onSelectAll={handleSelectAll}
          selectMode={selectMode}
          isSelectAll={selectedList.length && currentList.list.length == selectedList.length} />
      </View>
      {listComponent}
      <Menu menus={menus} buttonPosition={buttonPosition} onPress={handleMenuPress} visible={visibleMenu} hideMenu={hideMenu} />
      <MusicPositionModal
        selectedList={selectedListRef.current}
        selectedData={selectedDataRef.current.data}
        visible={visibleMusicPosition}
        hideModal={hideMusicPositionModal}
        onConfirm={handleSetMusicPosition} />
      <MusicAddModal
        visible={visibleMusicAddModal}
        listId={activeListIdRef.current}
        isMove={isMoveRef.current}
        hideModal={hideMusicAddModal}
        musicInfo={selectedDataRef.current.data} />
      <MusicMultiAddModal
        visible={visibleMusicMultiAddModal}
        hideModal={hideMusicMultiAddModal}
        list={selectedListRef.current}
        listId={activeListIdRef.current}
        isMove={isMoveRef.current}
        excludeList={[activeListIdRef.current]}
        onAdd={handleCancelMultiSelect} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    flexShrink: 1,
  },
})

export default List
