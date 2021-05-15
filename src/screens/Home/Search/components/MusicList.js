import React, { useState, useCallback, memo, useEffect, useRef } from 'react'
import { InteractionManager } from 'react-native'
import { useGetter, useDispatch } from '@/store'
import OnlineList from '@/components/OnlineList'

export default memo(({ page, setPage }) => {
  const [isListRefreshing, setIsListRefreshing] = useState(false)
  const [visibleLoadingMask, setVisibleLoadingMask] = useState(false)
  const text = useGetter('search', 'text')
  const textRef = useRef(text)
  const searchSource = useGetter('search', 'searchSource')
  const listInfo = useGetter('search', 'listInfo')
  const isLoading = useGetter('search', 'isLoading')
  const isEnd = useGetter('search', 'isEnd')
  const search = useDispatch('search', 'search')
  const listInfoRef = useRef(listInfo)

  useEffect(() => {
    textRef.current = text
  }, [text])

  const handleRefresh = useCallback(() => {
    setIsListRefreshing(true)
    setVisibleLoadingMask(true)
    setPage(1)
    search({ page: 1, limit: listInfoRef.current.limit }).finally(() => {
      setIsListRefreshing(false)
      setVisibleLoadingMask(false)
    })
  }, [search, setPage])

  const handleLoadMore = useCallback(() => {
    if (isLoading || isEnd || !textRef.current.length) return
    setPage(listInfoRef.current.page + 1)
    search({ page: listInfoRef.current.page + 1, limit: listInfoRef.current.limit })
  }, [isLoading, isEnd, setPage, search])

  useEffect(() => {
    listInfoRef.current = listInfo
  }, [listInfo])

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setVisibleLoadingMask(true)
      setPage(1)
      search({ page: 1, limit: listInfo.limit }).finally(() => {
        setIsListRefreshing(false)
        setVisibleLoadingMask(false)
      })
    })
  }, [searchSource, search, setIsListRefreshing, listInfo.limit, setPage])

  return (
    <OnlineList
      list={listInfo.list}
      isEnd={isEnd}
      page={page}
      isListRefreshing={isListRefreshing}
      onRefresh={handleRefresh}
      onLoadMore={handleLoadMore}
      // progressViewOffset={20}
      isLoading={isLoading}
      visibleLoadingMask={isLoading && visibleLoadingMask}
      />
  )
})

