import React, { useState, useCallback, memo, useEffect, useMemo } from 'react'
import { InteractionManager } from 'react-native'
import { useGetter, useDispatch } from '@/store'
import OnlineList from '@/components/OnlineList'

export default memo(() => {
  const [isListRefreshing, setIsListRefreshing] = useState(false)
  const [visibleLoadingMask, setVisibleLoadingMask] = useState(false)
  const listInfo = useGetter('top', 'listInfo')
  const isLoading = useGetter('top', 'isLoading')
  const isEnd = useGetter('top', 'isEnd')
  const getList = useDispatch('top', 'getList')
  const tabId = useGetter('top', 'tabId')
  const [page, setPage] = useState(0)
  // const getListAll = useDispatch('top', 'getListAll')
  // console.log(isLoading)

  const handleRefresh = useCallback(() => {
    setIsListRefreshing(true)
    setVisibleLoadingMask(true)
    setPage(1)
    getList({ page: 1, isRefresh: true }).finally(() => {
      setVisibleLoadingMask(false)
      setIsListRefreshing(false)
    })
  }, [getList])

  const handleLoadMore = useCallback(() => {
    if (isLoading || isEnd) return
    setPage(listInfo.page + 1)
    getList({ page: listInfo.page + 1 })
  }, [isLoading, isEnd, getList, listInfo.page])

  // useEffect(() => {
  //   console.log(tabId)
  //   InteractionManager.runAfterInteractions(() => {
  //     getList({ page: 1 }).finally(() => {
  //       setIsListRefreshing(false)
  //     })
  //   })
  // }, [getList])

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setVisibleLoadingMask(true)
      setPage(1)
      getList({ page: 1 }).finally(() => {
        setVisibleLoadingMask(false)
        setIsListRefreshing(false)
      })
    })
  }, [getList, tabId])

  const visible = useMemo(() => isLoading && visibleLoadingMask, [isLoading, visibleLoadingMask])

  const listComponent = useMemo(() => {
    return (
      <OnlineList
        list={listInfo.list}
        isEnd={isEnd}
        page={page}
        isListRefreshing={isListRefreshing}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        // progressViewOffset={20}
        visibleLoadingMask={visible}
        isLoading={isLoading}
        />
    )
  }, [handleLoadMore, handleRefresh, isEnd, isListRefreshing, isLoading, listInfo.list, page, visible])

  return listComponent
})

