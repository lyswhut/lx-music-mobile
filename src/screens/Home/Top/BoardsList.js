import React, { memo, useMemo, useEffect, useCallback, useRef, useState } from 'react'
import { StyleSheet, View, Text, ScrollView } from 'react-native'

import Menu from '@/components/common/Menu'

import { useGetter, useDispatch } from '@/store'
import Button from '@/components/common/Button'
import { useTranslation } from '@/plugins/i18n'
import { LIST_ID_PLAY_TEMP } from '@/config/constant'
import { toast } from '@/utils/tools'

const Item = ({ item, tabId, showMenu, setTop, index, longPressIndex }) => {
  const theme = useGetter('common', 'theme')
  const buttonRef = useRef()

  const setPosition = useCallback(() => {
    if (buttonRef.current && buttonRef.current.measure) {
      buttonRef.current.measure((fx, fy, width, height, px, py) => {
        // console.log(fx, fy, width, height, px, py)
        showMenu({
          position: { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) },
          index,
        })
      })
    }
  }, [index, showMenu])

  return (
    <Button ref={buttonRef} style={{ ...styles.button, backgroundColor: index == longPressIndex ? theme.secondary40 : theme.primary }} key={item.id} onLongPress={setPosition} onPress={() => setTop({ tabId: item.id })}>
      <Text style={{ ...styles.buttonText, color: tabId == item.id ? theme.secondary : theme.normal }} numberOfLines={1}>{item.name}</Text>
    </Button>
  )
}

const BoardMenu = ({ visible, buttonPosition, index, hideMenu }) => {
  const { t } = useTranslation()
  const getListAll = useDispatch('top', 'getListAll')
  const createUserList = useDispatch('list', 'createUserList')
  const boards = useGetter('top', 'boards')
  const setPlayList = useDispatch('player', 'setList')
  const sourceId = useGetter('top', 'sourceId')

  const menus = useMemo(() => {
    return [
      { action: 'play', label: t('play') },
      { action: 'collect', label: t('collect') },
    ]
  }, [t])

  const handleMenuPress = useCallback(({ action }) => {
    hideMenu()
    if (action) {
      const board = boards[sourceId][index]
      getListAll({ id: board.id }).then(list => {
        if (!list.length) return

        switch (action) {
          case 'play':
            setPlayList({
              list: {
                list,
                id: LIST_ID_PLAY_TEMP,
              },
              index: 0,
            })
            break
          case 'collect':
            createUserList({
              name: board.name,
              id: `board__${sourceId}__${board.id}`,
              list,
              source: board.source,
              sourceListId: `board__${board.id}`,
              isShowToast: true,
            })
            toast(t('collect_success'))
            break
          default:
            break
        }
      })
    }
  }, [boards, createUserList, getListAll, hideMenu, index, setPlayList, sourceId, t])

  return (
    <Menu
      menus={menus}
      visible={visible}
      buttonPosition={buttonPosition}
      hideMenu={hideMenu}
      onPress={handleMenuPress}
    />
  )
}


export default memo(() => {
  const setTop = useDispatch('common', 'setTop')
  const getBoardsList = useDispatch('top', 'getBoardsList')
  const boards = useGetter('top', 'boards')
  const sourceId = useGetter('top', 'sourceId')
  const tabId = useGetter('top', 'tabId')
  const [visible, setVisible] = useState(false)
  const [longPressIndex, setLongPressIndex] = useState(-1)
  const [buttonPosition, setButtonPosition] = useState({})

  useEffect(() => {
    const list = boards[sourceId]
    if (list.length && !list.some(b => b.id == tabId)) {
      setTop({ tabId: list[0].id })
    }
  }, [boards])

  useEffect(() => {
    let list = boards[sourceId]
    if (list.length) {
      if (list.some(b => b.id == tabId)) return
      setTop({ tabId: list[0].id })
      return
    }
    getBoardsList().then(() => {
      list = boards[sourceId]
      if (list.some(b => b.id == tabId)) return
      setTop({ tabId: list.length ? list[0].id : null })
    })
  }, [sourceId])

  const list = useMemo(() => sourceId ? [...boards[sourceId]] : [], [boards, sourceId])

  const showMenu = useCallback(({ position, index }) => {
    setLongPressIndex(index)
    setButtonPosition(position)
    setVisible(true)
  }, [])
  const hideMenu = useCallback(() => {
    setVisible(false)
    setLongPressIndex(-1)
  }, [setVisible])

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps={'always'}>
        <View style={styles.list}>
          {
            list.map((item, index) => (<Item key={item.id} item={item} index={index} longPressIndex={longPressIndex} tabId={tabId} showMenu={showMenu} setTop={setTop} />))
          }
        </View>
      </ScrollView>
      <BoardMenu visible={visible} buttonPosition={buttonPosition} index={longPressIndex} hideMenu={hideMenu} />
    </View>
  )
})


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollView: {
    flexShrink: 1,
  },
  list: {

  },
  button: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  buttonText: {
    fontSize: 12,
  },
})
