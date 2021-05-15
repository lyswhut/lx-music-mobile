import React, { useCallback, useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'

import { useGetter, useDispatch } from '@/store'
import SourceSelector from './SourceSelector'
import BoardsList from './BoardsList'
import { BorderWidths } from '@/theme'
import { useLayout } from '@/utils/hooks'


export default () => {
  const theme = useGetter('common', 'theme')
  const { onLayout, ...layout } = useLayout()

  return (
    <View style={{ ...styles.container, borderRightColor: theme.borderColor }} onLayout={onLayout}>
      <SourceSelector layout={layout} />
      <BoardsList />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    width: '26%',
    flexGrow: 0,
    flexShrink: 0,
    borderRightWidth: BorderWidths.normal,
  },
})

