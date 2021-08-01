import React, { memo, useMemo, useEffect, useCallback, useState, useRef } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native'

import { useGetter, useDispatch } from '@/store'
import { useTranslation } from '@/plugins/i18n'
import DorpDownPanel from '@/components/common/DorpDownPanel'
import Icon from '@/components/common/Icon'
// import Button from '@/components/common/Button'
import { BorderWidths } from '@/theme'
import Menu from '@/components/common/Menu'
import ConfirmAlert from '@/components/common/ConfirmAlert'
import Input from '@/components/common/Input'
import { getListScrollPosition, saveListScrollPosition } from '@/utils/tools'
import { LIST_SCROLL_POSITION_KEY } from '@/config/constant'
import musicSdk from '@/utils/music'

const ListItem = ({ onPress, name, id, showMenu, activeId, loading, index }) => {
  const theme = useGetter('common', 'theme')
  const moreButtonRef = useRef()
  const handleShowMenu = useCallback(() => {
    if (moreButtonRef.current && moreButtonRef.current.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        // console.log(fx, fy, width, height, px, py)
        showMenu(id, name, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }, [showMenu, id, name, index])

  return (
    <View style={{ ...styles.listItem, borderBottomColor: theme.secondary45, opacity: loading ? 0.5 : 1 }}>
      <TouchableOpacity style={styles.listName} onPress={onPress}>
        <Text numberOfLines={1} style={{ color: theme.normal }}>{name}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleShowMenu} ref={moreButtonRef} style={styles.listMoreBtn}>
        <Icon name="dots-vertical" style={{ color: theme.normal35 }} size={16} />
      </TouchableOpacity>
    </View>
  )
}

const List = memo(({ setVisiblePanel, currentList, activeListIdRef, handleCancelMultiSelect }) => {
  const theme = useGetter('common', 'theme')
  const defaultList = useGetter('list', 'defaultList')
  const loveList = useGetter('list', 'loveList')
  const userListRef = useRef([])
  const userList = useGetter('list', 'userList')
  const setPrevSelectListId = useDispatch('common', 'setPrevSelectListId')
  const setUserListName = useDispatch('list', 'setUserListName')
  // const setUserListPosition = useDispatch('list', 'setUserListPosition')
  const removeUserList = useDispatch('list', 'removeUserList')
  const [visibleMenu, setVisibleMenu] = useState(false)
  // const activeListId = useGetter('common', 'prevSelectListId')
  const [selectedListIndex, setSelectedListIndex] = useState(-1)
  const selectedListRef = useRef({})
  const { t } = useTranslation()
  const [buttonPosition, setButtonPosition] = useState({ w: 0, h: 0, x: 0, y: 0 })
  const [visibleRename, setVisibleRename] = useState(false)
  const [listNameText, setListNameText] = useState('')
  const scrollViewRef = useRef()
  const setList = useDispatch('list', 'setList')
  const getBoardListAll = useDispatch('top', 'getListAll')
  const getListDetailAll = useDispatch('songList', 'getListDetailAll')
  const [fetchingListStatus, setFetchingListStatus] = useState({})

  useEffect(() => {
    userListRef.current = userList
  }, [userList])

  const handleToggleList = useCallback(({ id }) => {
    setVisiblePanel(false)
    setPrevSelectListId(id)
  }, [setPrevSelectListId, setVisiblePanel])

  const handleRemoveList = useCallback(id => {
    removeUserList({ id })
  }, [removeUserList])


  const hideMenu = useCallback(() => {
    setVisibleMenu(false)
  }, [setVisibleMenu])
  const fetchList = useCallback((id, source, sourceListId) => {
    setFetchingListStatus(fetchingListStatus => ({ ...fetchingListStatus, [id]: true }))
    // console.log(sourceListId)
    let promise
    if (/board__/.test(sourceListId)) {
      const id = sourceListId.replace(/board__/, '')
      promise = getBoardListAll(id)
    } else {
      promise = getListDetailAll({ source, id: sourceListId })
    }
    return promise.finally(() => {
      setFetchingListStatus(fetchingListStatus => ({ ...fetchingListStatus, [id]: false }))
    })
  }, [getBoardListAll, getListDetailAll])
  const handleSyncSourceList = useCallback(async index => {
    const targetListInfo = userList[index]
    const list = await fetchList(targetListInfo.id, targetListInfo.source, targetListInfo.sourceListId)
    // console.log(targetListInfo.list.length, list.length)
    handleCancelMultiSelect()
    setList({
      ...targetListInfo,
      list,
    })
  }, [fetchList, handleCancelMultiSelect, setList, userList])
  const handleMenuPress = useCallback(({ action }) => {
    switch (action) {
      case 'rename':
        setListNameText(selectedListRef.current.name)
        setVisibleRename(true)
        break
      case 'sync':
        handleSyncSourceList(selectedListRef.current.index)
        break
        // case 'changePosition':

      //   break
      case 'remove':
        handleRemoveList(selectedListRef.current.id)
        break

      default:
        break
    }
  }, [handleRemoveList, handleSyncSourceList])

  const menus = useMemo(() => {
    const list = userList[selectedListIndex]
    if (!list) return []
    const source = list.source

    return [
      { action: 'rename', label: t('list_rename') },
      { action: 'sync', label: t('list_sync'), disabled: !source || !musicSdk[source].songList },
      // { action: 'changePosition', label: t('change_position') },
      { action: 'remove', label: t('list_remove') },
    ]
  }, [selectedListIndex, userList, t])

  const handleCancelRename = useCallback(() => {
    setVisibleRename(false)
  }, [])
  const handleRename = useCallback(() => {
    if (!listNameText.length) return
    setUserListName({ id: selectedListRef.current.id, name: listNameText })
    setVisibleRename(false)
  }, [listNameText, setUserListName])

  const handleToggleDefaultList = () => {
    handleToggleList(defaultList)
  }
  const handleToggleLoveList = () => {
    handleToggleList(loveList)
  }

  const handleScroll = useCallback(({ nativeEvent }) => {
    saveListScrollPosition(LIST_SCROLL_POSITION_KEY, nativeEvent.contentOffset.y)
  }, [])

  useEffect(() => {
    const offset = getListScrollPosition(LIST_SCROLL_POSITION_KEY)
    scrollViewRef.current.scrollTo({ x: 0, y: offset, animated: false })
  })
  const showMenu = useCallback((id, name, index, position) => {
    // console.log(position)
    if (id == 'default' || id == 'love') return
    setButtonPosition({ ...position })
    selectedListRef.current.id = id
    selectedListRef.current.name = name
    selectedListRef.current.index = index
    setSelectedListIndex(index)
    setVisibleMenu(true)
  }, [])
  return (
    <View style={{ ...styles.container, borderTopColor: theme.secondary10 }}>
      <ScrollView style={{ flexShrink: 1, flexGrow: 0 }} onScroll={handleScroll} ref={scrollViewRef} keyboardShouldPersistTaps={'always'}>
        <View style={{ ...styles.listContainer, backgroundColor: theme.primary }} onStartShouldSetResponder={() => true}>
          <View style={{ ...styles.listItem, borderBottomColor: theme.secondary45 }}>
            <TouchableOpacity style={styles.listName} onPress={handleToggleDefaultList}>
              <Text numberOfLines={1} style={{ color: theme.normal }}>{defaultList.name}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ ...styles.listItem, borderBottomColor: theme.secondary45 }}>
            <TouchableOpacity style={styles.listName} onPress={handleToggleLoveList}>
              <Text numberOfLines={1} style={{ color: theme.normal }}>{loveList.name}</Text>
            </TouchableOpacity>
          </View>
          {userList.map(({ id, name }, index) => <ListItem key={id} name={name} id={id} index={index} loading={fetchingListStatus[id]} onPress={() => handleToggleList({ id, name })} activeId={currentList.id} showMenu={showMenu} />)}
        </View>
      </ScrollView>
      <Menu menus={menus} buttonPosition={buttonPosition} onPress={handleMenuPress} visible={visibleMenu} hideMenu={hideMenu} />
      <ConfirmAlert
        visible={visibleRename}
        onHide={handleCancelRename}
        onConfirm={handleRename}
        >
        <View style={styles.renameContent}>
          <Text style={{ color: theme.normal, marginBottom: 5 }}>{t('list_rename_title')}</Text>
          <Input
            placeholder={selectedListRef.current.name}
            value={listNameText}
            onChangeText={setListNameText}
            style={{ ...styles.input, backgroundColor: theme.secondary40 }}
          />
        </View>
      </ConfirmAlert>
    </View>
  )
})


export default memo(({ currentList, activeListIdRef, handleCancelMultiSelect }) => {
  const theme = useGetter('common', 'theme')
  const [visiblePanel, setVisiblePanel] = useState(false)

  return (
    <DorpDownPanel
      visible={visiblePanel}
      setVisible={setVisiblePanel}
      PanelContent={<List setVisiblePanel={setVisiblePanel} currentList={currentList} activeListIdRef={activeListIdRef} handleCancelMultiSelect={handleCancelMultiSelect} />}
    >
      <View style={styles.currentList}>
        <Text style={{ ...styles.sourceMenu, color: theme.secondary, flex: 1 }}>{currentList.name}</Text>
        {/* <TouchableOpacity style={styles.createList}><Icon style={{ color: theme.secondary30, fontSize: 24 }} name="playlist-plus" /></TouchableOpacity> */}
      </View>
    </DorpDownPanel>
  )
})


const styles = StyleSheet.create({
  sourceMenu: {
    minWidth: 70,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },

  container: {
    borderTopWidth: BorderWidths.normal2,
  },
  listContainer: {
    // borderTopWidth: BorderWidths.normal2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: BorderWidths.normal,
  },
  listName: {
    // height: 46,
    paddingTop: 12,
    paddingBottom: 12,
    justifyContent: 'center',
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 10,
  },
  listMoreBtn: {
    width: 50,
    // height: 46,
    paddingTop: 12,
    paddingBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  currentList: {
    flexDirection: 'row',
  },
  createList: {
    width: 38,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },


  renameContent: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 240,
    borderRadius: 4,
    paddingTop: 2,
    paddingBottom: 2,
    fontSize: 12,
  },

  // tagTypeList: {
  //   flexDirection: 'row',
  //   flexWrap: 'wrap',
  // },
  // tagButton: {
  //   // marginRight: 10,
  //   borderRadius: 4,
  //   marginRight: 10,
  //   marginBottom: 10,
  // },
  // tagButtonText: {
  //   paddingLeft: 12,
  //   paddingRight: 12,
  //   paddingTop: 8,
  //   paddingBottom: 8,
  // },
})
