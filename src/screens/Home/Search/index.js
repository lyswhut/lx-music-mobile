import React, { useCallback, useRef, useState, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

import music from '@/utils/music'
import { useGetter, useDispatch } from '@/store'
import { BorderWidths } from '@/theme'
// import InsetShadow from 'react-native-inset-shadow'
import SourceSelector from './components/SourceSelector'
import Input from './components/Input'
import TipList from './components/TipList'
import MusicList from './components/MusicList'
import { useLayout } from '@/utils/hooks'


export default () => {
  const searchInputRef = useRef()
  const theme = useGetter('common', 'theme')
  const tempSearchSource = useGetter('search', 'tempSearchSource')
  const tempSearchSourceRef = useRef('')
  const listInfo = useGetter('search', 'listInfo')
  const listInfoRef = useRef({})
  const tipListVisible = useGetter('search', 'tipListVisible')
  const tipListVisibleRef = useRef('')
  const setText = useDispatch('search', 'setText')
  const setTipList = useDispatch('search', 'setTipList')
  const setVisibleTipList = useDispatch('search', 'setVisibleTipList')
  const search = useDispatch('search', 'search')
  const { onLayout, ...listLayout } = useLayout()
  const [page, setPage] = useState(0)

  useEffect(() => {
    listInfoRef.current = listInfo
  }, [listInfo])
  useEffect(() => {
    tempSearchSourceRef.current = tempSearchSource
  }, [tempSearchSource])
  useEffect(() => {
    tipListVisibleRef.current = tipListVisible
  }, [tipListVisible])

  const handleTipPress = useCallback(text => {
    if (tipListVisibleRef.current) setVisibleTipList(false)
    text = text.trim()
    music[tempSearchSourceRef.current].tempSearch.search(text).then(tipList => setTipList(tipList))
    searchInputRef.current.blur()
    setText(text)
    setPage(1)
    search({ page: 1, limit: listInfoRef.current.limit })
  }, [])

  const onSetTipList = list => {
    setTipList(list)
    if (list.length) {
      if (tipListVisibleRef.current) return
    } else if (!tipListVisibleRef.current) return
    if (searchInputRef.current.isFocused()) setVisibleTipList(true)
  }

  return (
    <View style={styles.container}>
      <View style={{ ...styles.searchBar, backgroundColor: theme.primary, borderBottomColor: theme.borderColor, borderBottomWidth: BorderWidths.normal }}>
        <SourceSelector />
        <Input ref={searchInputRef} onSetTipList={onSetTipList} setPage={setPage} />
      </View>
      <View style={styles.content} onLayout={onLayout}>
        <TipList onTipPress={handleTipPress} height={listLayout.height} />
        <MusicList page={page} setPage={setPage} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    height: 38,
    zIndex: 2,
    paddingRight: 5,
  },
})
