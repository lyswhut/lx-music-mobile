import React, { memo, useMemo, useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import PagerView from 'react-native-pager-view'
import Header from './components/Header'
import { useTranslation } from '@/plugins/i18n'
import { useGetter, useDispatch } from '@/store'
import { Icon } from '@/components/common/Icon'
import CommentHot from './CommentHot'
import CommentNew from './CommentNew'
import { toast } from '@/utils/tools'

const HeaderItem = ({ id, label, isActive, onPress }) => {
  const theme = useGetter('common', 'theme')
  // console.log(theme)
  const components = useMemo(() => (
    <TouchableOpacity style={styles.btn} onPress={() => !isActive && onPress(id)}>
      <Text style={{ ...styles.btnText, color: isActive ? theme.secondary : theme.normal10 }}>{label}</Text>
    </TouchableOpacity>
  ), [isActive, theme, label, onPress, id])

  return components
}

const HotCommentPage = ({ activeId, musicInfo, setTotal }) => {
  const initedRef = useRef(false)
  const comment = useMemo(() => <CommentHot musicInfo={musicInfo} setTotal={setTotal} />, [musicInfo, setTotal])
  switch (activeId) {
    // case 3:
    case 'hot':
      if (!initedRef.current) initedRef.current = true
      return comment
    default:
      return initedRef.current ? comment : null
  }
  // return activeId == 0 || activeId == 1 ? setting : null
}
const NewCommentPage = ({ activeId, musicInfo, setTotal }) => {
  const initedRef = useRef(false)
  const comment = useMemo(() => <CommentNew musicInfo={musicInfo} setTotal={setTotal} />, [musicInfo, setTotal])
  switch (activeId) {
    // case 3:
    case 'new':
      if (!initedRef.current) initedRef.current = true
      return comment
    default:
      return initedRef.current ? comment : null
  }
  // return activeId == 0 || activeId == 1 ? setting : null
}

export default memo(({ componentId, animated }) => {
  const pagerViewRef = useRef()
  const [activeId, setActiveId] = useState('hot')
  const [musicInfo, setMusicInfo] = useState({})
  const { t } = useTranslation()
  const theme = useGetter('common', 'theme')
  const [total, setTotal] = useState({ hot: 0, new: 0 })
  const setComponentId = useDispatch('common', 'setComponentId')

  useEffect(() => {
    setComponentId({ name: 'comment', id: componentId })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tabs = useMemo(() => {
    return [
      { id: 'hot', label: t('comment_tab_hot', { total: total.hot ? `(${total.hot})` : '' }) },
      { id: 'new', label: t('comment_tab_new', { total: total.new ? `(${total.new})` : '' }) },
    ]
  }, [total, t])

  const toggleTab = useCallback(id => {
    setActiveId(id)
    pagerViewRef.current.setPage(tabs.findIndex(tab => tab.id == id))
  }, [tabs])

  const onPageSelected = useCallback(({ nativeEvent }) => {
    setActiveId(tabs[nativeEvent.position].id)
  }, [tabs])

  const refreshComment = useCallback(() => {
    setMusicInfo(musicInfo => {
      if (musicInfo.songmid == global.playInfo.currentPlayMusicInfo.songmid) {
        toast(t('comment_refresh', { name: musicInfo.name }))
      }
      return global.playInfo.currentPlayMusicInfo
    })
  }, [t])

  const setHotTotal = useCallback(total => {
    setTotal(totalInfo => ({ ...totalInfo, hot: total }))
  }, [])
  const setNewTotal = useCallback(total => {
    setTotal(totalInfo => ({ ...totalInfo, new: total }))
  }, [])

  useEffect(() => {
    setMusicInfo(global.playInfo.currentPlayMusicInfo)
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <Header musicInfo={musicInfo} />
      <View style={{ ...styles.container, backgroundColor: theme.primary }}>
        <View style={styles.tabHeader}>
          <View style={styles.left}>
            {tabs.map(({ id, label }) => <HeaderItem id={id} label={label} key={id} isActive={activeId == id} onPress={toggleTab} />)}
          </View>
          <View style={styles.right}>
            <TouchableOpacity onPress={refreshComment} style={{ ...styles.button }}>
              <Icon name="autorenew" style={{ color: theme.normal20 }} size={24} />
            </TouchableOpacity>
          </View>
        </View>
        <PagerView
          ref={pagerViewRef}
          onPageSelected={onPageSelected}
          // onPageScrollStateChanged={onPageScrollStateChanged}
          style={styles.pagerView}
        >
          <View collapsable={false} style={styles.pageStyle}>
            <HotCommentPage activeId={activeId} musicInfo={musicInfo} setTotal={setHotTotal} />
          </View>
          <View collapsable={false} style={styles.pageStyle}>
            <NewCommentPage activeId={activeId} musicInfo={musicInfo} setTotal={setNewTotal} />
          </View>
        </PagerView>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabHeader: {
    flexDirection: 'row',
    // paddingLeft: 10,
    paddingRight: 10,
    // justifyContent: 'center',
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 5,
  },
  btn: {
    // flex: 1,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: 'rgba(0,0,0,0)',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  btnText: {
    fontSize: 16,
    // color: 'white',
  },
  pagerView: {
    flex: 1,
  },
  pageStyle: {
    overflow: 'hidden',
  },
})
