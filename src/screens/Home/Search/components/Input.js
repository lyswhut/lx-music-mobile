import React, { useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
// import { StyleSheet } from 'react-native'
import Input from '@/components/common/Input'

import music from '@/utils/music'
import { useGetter, useDispatch } from '@/store'
import { debounce } from '@/utils'

const debounceTipSearch = debounce((str, tempSearchSource, callback) => {
  return music[tempSearchSource].tempSearch.search(str).then(callback)
}, 200)

export default forwardRef(({ onSetTipList, setPage }, ref) => {
  const searchInputRef = useRef()
  const text = useGetter('search', 'text')

  const tempSearchSource = useGetter('search', 'tempSearchSource')
  // const searchSource = useGetter('search', 'searchSource')
  const listInfo = useGetter('search', 'listInfo')
  const setText = useDispatch('search', 'setText')
  const search = useDispatch('search', 'search')

  const tipListVisible = useGetter('search', 'tipListVisible')
  const setVisibleTipList = useDispatch('search', 'setVisibleTipList')


  useImperativeHandle(ref, () => {
    return {
      blur() {
        searchInputRef.current.blur()
      },
      isFocused() {
        return searchInputRef.current.isFocused()
      },
    }
  })

  const showTipList = useCallback(() => {
    if (tipListVisible || !text.length) return
    setVisibleTipList(true)
  }, [tipListVisible, setVisibleTipList, text])

  const hideTipList = useCallback(() => {
    if (!tipListVisible) return
    setVisibleTipList(false)
  }, [tipListVisible, setVisibleTipList])

  const handleSearchInput = useCallback(str => {
    setText(str)
    if (str.length) {
      debounceTipSearch(str, tempSearchSource, onSetTipList)
    } else {
      music[tempSearchSource].tempSearch.search('')
      hideTipList()
    }
  }, [setText, hideTipList, tempSearchSource, onSetTipList])

  const handleSearch = useCallback((text) => {
    setText(text.trim())
    setPage(1)
    return search({ page: 1, limit: listInfo.limit })
  }, [setText, setPage, search, listInfo.limit])

  const onClearText = useCallback(() => {
    handleSearchInput('')
    handleSearch('')
  }, [handleSearchInput, handleSearch])

  return (
    <Input
      onChangeText={handleSearchInput}
      placeholder="Search for something..."
      value={text}
      // onFocus={showTipList}
      clearBtn
      ref={searchInputRef}
      onBlur={hideTipList}
      onSubmitEditing={ ({ nativeEvent: { text } }) => handleSearch(text) }
      onClearText={onClearText}
      onTouchStart={showTipList} />
  )
})
