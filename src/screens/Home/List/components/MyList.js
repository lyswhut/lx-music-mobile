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

const ListItem = ({ onPress, name, id, showMenu, activeId }) => {
  const theme = useGetter('common', 'theme')
  const moreButtonRef = useRef()
  const handleShowMenu = useCallback(() => {
    if (moreButtonRef.current && moreButtonRef.current.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        // console.log(fx, fy, width, height, px, py)
        showMenu(id, name, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }, [showMenu, id, name])

  return (
    <View style={{ ...styles.listItem, borderBottomColor: theme.secondary45 }}>
      <TouchableOpacity style={styles.listName} onPress={onPress}>
        <Text numberOfLines={1} style={{ color: theme.normal }}>{name}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleShowMenu} ref={moreButtonRef} style={styles.listMoreBtn}>
        <Icon name="dots-vertical" style={{ color: theme.normal35 }} size={16} />
      </TouchableOpacity>
    </View>
  )
}

const List = memo(({ setVisiblePanel, currentList, activeListIdRef }) => {
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
  const selectedListRef = useRef({})
  const { t } = useTranslation()
  const [buttonPosition, setButtonPosition] = useState({ w: 0, h: 0, x: 0, y: 0 })
  const [visibleRename, setVisibleRename] = useState(false)
  const [listNameText, setListNameText] = useState('')
  const scrollViewRef = useRef()

  useEffect(() => {
    userListRef.current = userList
  }, [userList])

  const handleToggleList = useCallback(({ id }) => {
    setVisiblePanel(false)
    setPrevSelectListId(id)
  }, [setPrevSelectListId, setVisiblePanel])

  const handleRemoveList = useCallback(id => {
    if (id == activeListIdRef.current) setPrevSelectListId(userList[0].id)
    removeUserList(id)
  }, [activeListIdRef, userList, removeUserList, setPrevSelectListId])

  const showMenu = useCallback((id, name, position) => {
    // console.log(position)
    if (id == 'default' || id == 'love') return
    setButtonPosition({ ...position })
    selectedListRef.current.id = id
    selectedListRef.current.name = name
    setVisibleMenu(true)
  }, [setButtonPosition])
  const hideMenu = useCallback(() => {
    setVisibleMenu(false)
  }, [setVisibleMenu])
  const handleMenuPress = useCallback(({ action }) => {
    switch (action) {
      case 'rename':
        setListNameText(selectedListRef.current.name)
        setVisibleRename(true)
        break
        // case 'sync':

      //   break
      case 'changePosition':

        break
      case 'remove':
        handleRemoveList(selectedListRef.current.id)
        break

      default:
        break
    }
  }, [handleRemoveList])

  const menus = useMemo(() => {
    return [
      { action: 'rename', label: t('list_rename') },
      // { action: 'sync', label: t('list_sync') },
      // { action: 'changePosition', label: t('change_position') },
      { action: 'remove', label: t('list_remove') },
    ]
  }, [t])

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
          {userList.map(({ id, name }) => <ListItem key={id} name={name} id={id} onPress={() => handleToggleList({ id, name })} activeId={currentList.id} showMenu={showMenu} />)}
        </View>
      </ScrollView>
      <Menu menus={menus} buttonPosition={buttonPosition} onPress={handleMenuPress} visible={visibleMenu} hideMenu={hideMenu} />
      <ConfirmAlert
        visible={visibleRename}
        onCancel={handleCancelRename}
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


export default memo(({ currentList, activeListIdRef }) => {
  const theme = useGetter('common', 'theme')
  const [visiblePanel, setVisiblePanel] = useState(false)

  return (
    <DorpDownPanel
      visible={visiblePanel}
      setVisible={setVisiblePanel}
      PanelContent={<List setVisiblePanel={setVisiblePanel} currentList={currentList} activeListIdRef={activeListIdRef} />}
    >
      <Text style={{ ...styles.sourceMenu, color: theme.secondary }}>{currentList.name}</Text>
    </DorpDownPanel>
  )
})


const styles = StyleSheet.create({
  sourceMenu: {
    height: 38,
    lineHeight: 38,
    minWidth: 70,
    paddingLeft: 10,
    paddingRight: 10,
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
    height: 46,
    justifyContent: 'center',
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 10,
  },
  listMoreBtn: {
    width: 50,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
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
