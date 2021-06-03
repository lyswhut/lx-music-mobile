import React, { useState, useCallback, useRef } from 'react'
// import { View, Text, StyleSheet, Animated, FlatList, ImageBackground } from 'react-native'
import ListDetailHeader from './Header'
import Failed from './Failed'
import { useGetter, useDispatch } from '@/store'
import OnlineList from '@/components/OnlineList'


export default ({ animatePlayed }) => {
  const [isListRefreshing, setIsListRefreshing] = useState(false)
  const isGetListDetailFailed = useGetter('songList', 'isGetListDetailFailed')

  const selectListInfo = useGetter('songList', 'selectListInfo')
  const selectListInfoRef = useRef(selectListInfo)
  const listDetailData = useGetter('songList', 'listDetailData')
  const getListDetail = useDispatch('songList', 'getListDetail')

  const handleListLoadMore = useCallback(() => {
    if (listDetailData.isLoading || listDetailData.isEnd) return
    getListDetail({ id: selectListInfoRef.current.id, page: listDetailData.page + 1 })
  }, [getListDetail, listDetailData])

  const handleListRefresh = useCallback(() => {
    setIsListRefreshing(true)
    getListDetail({ id: selectListInfoRef.current.id, page: 1, isRefresh: true }).finally(() => {
      setIsListRefreshing(false)
    })
  }, [getListDetail])

  return (
    <>
      <OnlineList
        list={animatePlayed ? listDetailData.list : []}
        page={-1}
          // isEnd={listDetailData.isEnd}
        isListRefreshing={isListRefreshing}
        onRefresh={handleListRefresh}
        onLoadMore={handleListLoadMore}
        isLoading={listDetailData.isLoading}
        ListHeaderComponent={<ListDetailHeader />}
      />

      { isGetListDetailFailed ? <Failed /> : null }
    </>
  )
}
