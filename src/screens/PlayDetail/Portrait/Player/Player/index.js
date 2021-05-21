import React, { useCallback, memo, useMemo, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useLayout, useKeyboard } from '@/utils/hooks'
import { useGetter, useDispatch } from '@/store'
import { BorderWidths } from '@/theme'

import Title from './components/Title'
import MoreBtn from './components/MoreBtn'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'


export default memo(({ playNextModes }) => {
  // const { onLayout, ...layout } = useLayout()
  const theme = useGetter('common', 'theme')

  return (
    <View style={{ ...styles.container, backgroundColor: theme.primary }}>
      <View style={{ ...styles.info }}>
        <Title />
        <MoreBtn />
      </View>
      <View style={styles.status}>
        <PlayInfo />
      </View>
      <View style={styles.control}>
        <ControlBtn playNextModes={playNextModes} />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    width: '100%',
    // paddingTop: progressContentPadding,
    // marginTop: -progressContentPadding,
    // backgroundColor: 'rgba(0, 0, 0, .1)',
    padding: 15,
    // backgroundColor: AppColors.primary,
    // backgroundColor: 'red',
  },
  info: {
    flexDirection: 'row',
    paddingBottom: 10,
  },
  status: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 5,
    justifyContent: 'space-evenly',
  },
  control: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexGrow: 0,
    flexShrink: 0,
    paddingLeft: '15%',
    paddingRight: '15%',
    paddingTop: '10%',
    paddingBottom: '8%',
  },
  row: {
    flexDirection: 'row',
    flexGrow: 0,
    flexShrink: 0,
  },
})
