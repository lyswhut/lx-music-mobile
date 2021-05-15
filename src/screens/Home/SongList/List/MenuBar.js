import React, { useCallback, useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'

import { useGetter, useDispatch } from '@/store'
import SourceSelector from './SourceSelector'
import SortTab from './SortTab'
import Tag from './Tag'
// import { BorderWidths } from '@/theme'

export default () => {
  const theme = useGetter('common', 'theme')

  return (
    <View style={{ ...styles.container }}>
      <SortTab />
      <Tag />
      <SourceSelector />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
    // borderBottomWidth: BorderWidths.normal,
  },
})

