import React, { memo, useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native'
import { useGetter, useDispatch } from '@/store'
import music from '@/utils/music'
import CommentFloor from './components/CommentFloor'
import { useTranslation } from '@/plugins/i18n'
const limit = 15

const getComment = async(musicInfo, page, limit, retryNum = 0) => {
  let resp
  try {
    resp = await music[musicInfo.source].comment.getHotComment(musicInfo, page, limit)
  } catch (error) {
    console.log(error.message)
    if (error.message == '取消请求' || ++retryNum > 2) throw error
    resp = await getComment(musicInfo, page, limit, retryNum)
  }
  return resp
}
const filterList = list => {
  let keys = []
  return list.filter(c => {
    let id = String(c.id)
    if (keys.includes(id)) return false
    keys.push(id)
    return true
  })
}

export default memo(({ musicInfo, setTotal }) => {
  const [isListRefreshing, setIsListRefreshing] = useState(false)
  const [isLoadError, setIsLoadError] = useState(false)
  // const [isLoading, setIsLoading] = useState(false)
  const [isEnd, setIsEnd] = useState(false)
  const [commentList, setCommentList] = useState([])
  const theme = useGetter('common', 'theme')
  const { t } = useTranslation()
  const scrollViewRef = useRef()
  const listInfo = useRef({ page: 1, total: 0, maxPage: 1, isEnd: false, isLoading: false, isLoadError: false })
  const handleGetComment = (musicInfo, page) => {
    // setIsLoading(true)
    listInfo.current.isLoading = true
    return getComment(musicInfo, page, limit).then(commentInfo => {
      listInfo.current.page = page
      listInfo.current.isLoading = false
      // setIsLoading(false)
      if (listInfo.current.isLoadError) {
        listInfo.current.isLoadError = false
        setIsLoadError(false)
      }
      return commentInfo
    }).catch(err => {
      console.log(err)
      if (err.message != '取消请求') {
        listInfo.current.isLoading = false
        // setIsLoading(false)
        listInfo.current.isLoadError = true
        setIsLoadError(true)
      }
      return Promise.reject(err)
    })
  }
  const handleListLoadMore = useCallback(() => {
    if (listInfo.current.isLoading || listInfo.current.isEnd) return
    const page = listInfo.current.page + 1
    handleGetComment(musicInfo, page).then(({ comments }) => {
      let isEnd = page >= listInfo.current.maxPage
      if (listInfo.current.isEnd != isEnd) {
        listInfo.current.isEnd = isEnd
        setIsEnd(isEnd)
      }
      setCommentList(commentList => {
        return filterList([...commentList, ...comments])
      })
    })
  }, [musicInfo])

  const handleListRefresh = useCallback(() => {
    setIsListRefreshing(true)
    handleGetComment(musicInfo, 1).then(({ comments, maxPage, total }) => {
      listInfo.current.total = total
      listInfo.current.maxPage = maxPage
      setTotal(total)
      let isEnd = maxPage === 1
      if (listInfo.current.isEnd != isEnd) {
        listInfo.current.isEnd = isEnd
        setIsEnd(isEnd)
      }
      setCommentList(filterList(comments))
    }).finally(() => {
      setIsListRefreshing(false)
    })
  }, [musicInfo, setTotal])

  const handleShowComment = useCallback(musicInfo => {
    listInfo.current.page = 1
    listInfo.current.total = 0
    listInfo.current.maxPage = 1
    listInfo.current.isEnd = false
    listInfo.current.isLoading = false
    listInfo.current.isLoadError = false
    setCommentList([])
    if (!musicInfo.songmid || !music[musicInfo.source]?.comment) return setIsEnd(true)
    handleGetComment(musicInfo, 1).then(({ comments, maxPage, total }) => {
      listInfo.current.total = total
      listInfo.current.maxPage = maxPage
      setTotal(total)
      let isEnd = maxPage === 1
      if (listInfo.current.isEnd != isEnd) {
        listInfo.current.isEnd = isEnd
        setIsEnd(isEnd)
      }
      setCommentList(filterList(comments))
    })
  }, [])

  useEffect(() => {
    handleShowComment(musicInfo)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleShowComment, musicInfo.songmid])


  const footerStatus = isEnd
    ? 'list_end'
    : isLoadError
      ? 'list_error'
      : 'list_loading'

  const handleRenderItem = ({ item }) => {
    return (
      <CommentFloor comment={item} />
    )
  }

  const refreshControl = useMemo(() => (
    <RefreshControl
      colors={[theme.secondary]}
      progressBackgroundColor={theme.primary}
      refreshing={isListRefreshing}
      onRefresh={handleListRefresh} />
  ), [isListRefreshing, handleListRefresh, theme])

  return (
    <FlatList
      data={commentList}
      renderItem={handleRenderItem}
      keyExtractor={item => item.id}
      style={styles.container}
      ref={scrollViewRef}
      onEndReached={handleListLoadMore}
      onEndReachedThreshold={0.6}
      refreshControl={refreshControl}
      ListFooterComponent={
        footerStatus ? <View style={{ alignItems: 'center', padding: 10 }}><Text style={{ color: theme.normal30 }}>{t(footerStatus)}</Text></View> : null
      }
      // Fix Text in FlatList is not selectable on Android
      // https://github.com/facebook/react-native/issues/26264#issuecomment-559986861
      removeClippedSubviews={false}
      maxToRenderPerBatch={8}
      updateCellsBatchingPeriod={80}
      windowSize={16}
    />
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 15,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  space: {
    paddingTop: '80%',
  },
  line: {
    paddingTop: 8,
    paddingBottom: 8,
    // opacity: 0,
  },
  lineText: {
    // textAlign: 'center',
    fontSize: 16,
    lineHeight: 20,
    // paddingTop: 5,
    // paddingBottom: 5,
    // opacity: 0,
  },
  lineTranslationText: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 17,
    paddingTop: 5,
    // paddingBottom: 5,
  },
})
