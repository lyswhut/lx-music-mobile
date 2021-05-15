import React, { useCallback, memo, useEffect, useState, useMemo } from 'react'

import SearchTipList from '@/components/searchTipList'
import { useGetter, useDispatch } from '@/store'

export default memo(({ onTipPress, height }) => {
  // const tipList = useGetter('search', 'tipList')

  const text = useGetter('search', 'text')
  const list = useGetter('search', 'tipList')
  const visible = useGetter('search', 'tipListVisible')
  const setVisibleTipList = useDispatch('search', 'setVisibleTipList')

  const hideTipList = useCallback(() => {
    setVisibleTipList(false)
  }, [])

  useEffect(() => {
    if (visible && !text.length) hideTipList()
  }, [])

  const handleTipPress = useCallback(text => {
    hideTipList()
    onTipPress(text)
  }, [onTipPress, hideTipList])

  // console.log(visible)
  return (
    <SearchTipList
      list={list}
      visible={visible}
      onPress={handleTipPress}
      height={height}
      hideList={hideTipList}
    />
  )
})
