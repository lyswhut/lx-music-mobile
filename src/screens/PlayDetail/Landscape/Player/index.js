import React, { useCallback, memo, useMemo, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useLayout, useKeyboard } from '@/utils/hooks'
import { useGetter, useDispatch } from '@/store'
import { BorderWidths } from '@/theme'

import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'


export default memo(({ playNextModes }) => {
  // const { onLayout, ...layout } = useLayout()
  const theme = useGetter('common', 'theme')

  return (
    <View style={{ ...styles.container, backgroundColor: theme.primary }} nativeID="player">
      <PlayInfo />
      <ControlBtn playNextModes={playNextModes} />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    // paddingTop: progressContentPadding,
    // marginTop: -progressContentPadding,
    // backgroundColor: 'rgba(0, 0, 0, .1)',
    padding: 5,
    // backgroundColor: AppColors.primary,
    // backgroundColor: 'red',
  },
})
