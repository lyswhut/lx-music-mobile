import React, { memo, useMemo, useEffect, useCallback, useState, useRef } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, InteractionManager } from 'react-native'

import { useGetter, useDispatch } from '@/store'
import { useTranslation } from '@/plugins/i18n'
// import DorpDownPanel from '@/components/common/DorpDownPanel'
import Icon from '@/components/common/Icon'
// import Button from '@/components/common/Button'
import { BorderWidths } from '@/theme'
import Menu from '@/components/common/Menu'
import ConfirmAlert from '@/components/common/ConfirmAlert'
import Input from '@/components/common/Input'
import { filterFileName } from '@/utils'
import { getListScrollPosition, saveListScrollPosition, toast, handleSaveFile, handleReadFile, confirmDialog } from '@/utils/tools'
import { LIST_SCROLL_POSITION_KEY, LXM_FILE_EXT_RXP } from '@/config/constant'
import musicSdk from '@/utils/music'
import ChoosePath from '@/components/common/ChoosePath'
import { log } from '@/utils/log'
import Popup from '@/components/common/Popup'

const exportList = async(list, path) => {
  const data = JSON.parse(JSON.stringify({
    type: 'playListPart',
    data: list,
  }))
  for (const item of data.data.list) {
    if (item.otherSource) delete item.otherSource
    if (item.lrc) delete item.lrc
  }
  try {
    await handleSaveFile(path + `/lx_list_part_${filterFileName(list.name)}.lxmc`, data)
  } catch (error) {
    log.error(error.stack)
  }
}
const importList = async path => {
  let listData
  try {
    listData = await handleReadFile(path)
  } catch (error) {
    log.error(error.stack)
    return
  }
  console.log(listData.type)
  return listData
}

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

const ImportExport = ({ actionType, visible, hide, selectedListRef }) => {
  const [title, setTitle] = useState('')
  const [dirOnly, setDirOnly] = useState(false)
  const setList = useDispatch('list', 'setList')
  const createUserList = useDispatch('list', 'createUserList')
  const { t } = useTranslation()
  useEffect(() => {
    switch (actionType) {
      case 'import':
        setTitle(t('list_import_part_desc'))
        setDirOnly(false)
        break
      case 'export':
      default:
        setTitle(t('list_export_part_desc'))
        setDirOnly(true)
        break
    }
  }, [actionType, t])

  const onConfirmPath = useCallback(path => {
    hide()
    switch (actionType) {
      case 'import':
        toast(t('setting_backup_part_import_list_tip_unzip'))
        importList(path).then(async listData => {
          if (listData.type != 'playListPart') return toast(t('list_import_part_tip_failed'))
          const targetList = global.allList[listData.data.id]
          if (targetList) {
            const confirm = await confirmDialog({
              message: t('list_import_part_confirm', { importName: listData.data.name, localName: targetList.name }),
              cancelButtonText: t('list_import_part_button_cancel'),
              confirmButtonText: t('list_import_part_button_confirm'),
              bgClose: false,
            })
            if (confirm) {
              listData.data.name = targetList.name
              setList({
                name: listData.data.name,
                id: listData.data.id,
                list: listData.data.list,
                source: listData.data.source,
                sourceListId: listData.data.sourceListId,
              })
              return
            }
            listData.data.id += `__${Date.now()}`
          }
          createUserList({
            name: listData.data.name,
            id: listData.data.id,
            list: listData.data.list,
            source: listData.data.source,
            sourceListId: listData.data.sourceListId,
            position: Math.max(selectedListRef.current.index, -1),
          })
        })
        break
      case 'export':
        InteractionManager.runAfterInteractions(() => {
          toast(t('setting_backup_part_export_list_tip_zip'))
          exportList(selectedListRef.current.listInfo, path).then(() => {
            toast(t('setting_backup_part_export_list_tip_success'))
          }).catch(err => {
            log.error(err.message)
            toast(t('setting_backup_part_export_list_tip_failed') + ': ' + err.message)
          })
        })
        break
    }
  }, [actionType, createUserList, hide, setList, t])

  return (
    <ChoosePath
      visible={visible}
      hide={hide}
      title={title}
      dirOnly={dirOnly}
      filter={LXM_FILE_EXT_RXP}
      onConfirm={onConfirmPath} />
  )
}

const List = memo(({ setVisiblePanel, currentList, handleCancelMultiSelect }) => {
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
  const [isShowChoosePath, setShowChoosePath] = useState(false)
  const [actionType, setActionType] = useState('')

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

  const getTargetListInfo = useCallback(index => {
    let list
    switch (index) {
      case -2:
        list = defaultList
        break
      case -1:
        list = loveList
        break
      default:
        list = userListRef.current[index]
        break
    }
    return list
  }, [defaultList, loveList])

  const handleImportAndExportList = useCallback((type, index) => {
    const list = getTargetListInfo(index)
    if (!list) return
    selectedListRef.current.listInfo = list
    setActionType(type)
    setShowChoosePath(true)
  }, [getTargetListInfo])

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
    const list = await fetchList(targetListInfo.id, targetListInfo.source, targetListInfo.sourceListId).catch(err => {
      toast(t('list_update_error'))
      return Promise.reject(err)
    })
    // console.log(targetListInfo.list.length, list.length)
    handleCancelMultiSelect()
    setList({
      ...targetListInfo,
      list,
    })
    toast(t('list_update_success'))
  }, [fetchList, handleCancelMultiSelect, setList, t, userList])
  const handleMenuPress = useCallback(({ action }) => {
    switch (action) {
      case 'rename':
        setListNameText(selectedListRef.current.name)
        setVisibleRename(true)
        break
      case 'import':
        handleImportAndExportList('import', selectedListRef.current.index)
        break
      case 'export':
        handleImportAndExportList('export', selectedListRef.current.index)
        break
      case 'sync':
        handleSyncSourceList(selectedListRef.current.index)
        break
        // case 'changePosition':

      //   break
      case 'remove':
        confirmDialog({
          message: t('list_remove_tip', { name: selectedListRef.current.name }),
          confirmButtonText: t('list_remove_tip_button'),
        }).then(isRemove => {
          if (!isRemove) return
          handleRemoveList(selectedListRef.current.id)
        })
        break

      default:
        break
    }
  }, [handleImportAndExportList, handleRemoveList, handleSyncSourceList, t])

  const menus = useMemo(() => {
    let list
    let rename = false
    let sync = false
    let remove = false
    switch (selectedListIndex) {
      case -2:
        list = defaultList
        break
      case -1:
        list = loveList
        break
      default:
        list = userList[selectedListIndex]
        if (!list) return []
        rename = true
        remove = true
        sync = list.source && !!musicSdk[list.source].songList
        break
    }

    return [
      { action: 'rename', disabled: !rename, label: t('list_rename') },
      { action: 'sync', disabled: !sync, label: t('list_sync') },
      { action: 'import', label: t('list_import') },
      { action: 'export', label: t('list_export') },
      // { action: 'changePosition', label: t('change_position') },
      { action: 'remove', disabled: !remove, label: t('list_remove') },
    ]
  }, [selectedListIndex, t, defaultList, loveList, userList])

  const handleCancelRename = useCallback(() => {
    setVisibleRename(false)
  }, [])
  const handleRename = useCallback(() => {
    if (!listNameText.length) return
    setUserListName({ id: selectedListRef.current.id, name: listNameText })
    setVisibleRename(false)
  }, [listNameText, setUserListName])

  const handleScroll = useCallback(({ nativeEvent }) => {
    saveListScrollPosition(LIST_SCROLL_POSITION_KEY, nativeEvent.contentOffset.y)
  }, [])

  useEffect(() => {
    const offset = getListScrollPosition(LIST_SCROLL_POSITION_KEY)
    scrollViewRef.current.scrollTo({ x: 0, y: offset, animated: false })
  })
  const showMenu = useCallback((id, name, index, position) => {
    // console.log(position)
    // if (id == 'default' || id == 'love') return
    setButtonPosition({ ...position })
    selectedListRef.current.id = id
    selectedListRef.current.name = name
    selectedListRef.current.index = index
    setSelectedListIndex(index)
    setVisibleMenu(true)
  }, [])
  return (
    <>
      <ScrollView style={{ flexShrink: 1, flexGrow: 0 }} onScroll={handleScroll} ref={scrollViewRef} keyboardShouldPersistTaps={'always'}>
        <View style={{ ...styles.listContainer, backgroundColor: theme.primary }} onStartShouldSetResponder={() => true}>
          <ListItem name={defaultList.name} id={defaultList.id} index={-2} loading={false} onPress={() => handleToggleList(defaultList)} activeId={currentList.id} showMenu={showMenu} />
          <ListItem name={loveList.name} id={loveList.id} index={-1} loading={false} onPress={() => handleToggleList(loveList)} activeId={currentList.id} showMenu={showMenu} />
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
      <ImportExport actionType={actionType} visible={isShowChoosePath} hide={() => setShowChoosePath(false)} selectedListRef={selectedListRef} />
    </>
  )
})


export default memo(({ currentList, handleCancelMultiSelect, showListSearchBar }) => {
  const theme = useGetter('common', 'theme')
  const [visiblePanel, setVisiblePanel] = useState(false)
  const { t } = useTranslation()
  const showPopup = () => {
    setVisiblePanel(true)
  }
  const hidePopup = () => {
    setVisiblePanel(false)
  }

  return (
    <View>
      <TouchableOpacity onPress={showPopup} style={{ ...styles.currentList, borderBottomWidth: BorderWidths.normal, borderBottomColor: theme.borderColor }}>
        <Text numberOfLines={1} style={{ ...styles.sourceMenu, color: theme.secondary, flex: 1 }}>{currentList.name}</Text>
        <TouchableOpacity style={styles.btns} onPress={showListSearchBar}>
          <Icon style={{ color: theme.secondary30, fontSize: 16 }} name="search-2" />
        </TouchableOpacity>
      </TouchableOpacity>
      <Popup visible={visiblePanel} hide={hidePopup} title={t('nav_my_list')}>
        <List setVisiblePanel={setVisiblePanel} currentList={currentList} handleCancelMultiSelect={handleCancelMultiSelect} />
      </Popup>
    </View>
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

  // container: {
  //   borderBottomWidth: BorderWidths.normal2,
  // },
  listContainer: {
    // borderBottomWidth: BorderWidths.normal2,
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
    paddingRight: 2,
  },
  btns: {
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
