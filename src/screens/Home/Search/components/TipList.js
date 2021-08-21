import React, { useCallback, memo, useEffect, useState, useMemo } from 'react'
import { StyleSheet, Text } from 'react-native'

import Button from '@/components/common/Button'
import SearchTipList from '@/components/searchTipList'
import { useGetter, useDispatch } from '@/store'

export default memo(({ onTipPress, height }) => {
  // const tipList = useGetter('search', 'tipList')

  const text = useGetter('search', 'text')
  const list = useGetter('search', 'tipList')
  const visible = useGetter('search', 'tipListVisible')
  const setVisibleTipList = useDispatch('search', 'setVisibleTipList')
  const theme = useGetter('common', 'theme')

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

  const handleRenderItem = useCallback((item, index) => {
    return (
      <Button onPress={() => handleTipPress(item)} key={index}>
        <Text style={{ ...styles.text, color: theme.normal }}>{item}</Text>
      </Button>
    )
  }, [handleTipPress, theme])

  // console.log(visible)
  return (
    <SearchTipList
      list={list}
      visible={visible}
      height={height}
      hideList={hideTipList}
      renderItem={handleRenderItem}
    />
  )
})

const styles = StyleSheet.create({
  text: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
    // color: 'white',
  },
})
