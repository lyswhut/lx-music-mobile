import React, { useCallback, memo, useMemo, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useLayout, useKeyboard } from '@/utils/hooks'
import { useGetter, useDispatch } from '@/store'
// import { BorderWidths } from '@/theme'

import Pic from './components/Pic'
import Title from './components/Title'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'


export default memo(() => {
  // const { onLayout, ...layout } = useLayout()
  const { keyboardShown } = useKeyboard()
  const theme = useGetter('common', 'theme')
  const autoHidePlayBar = useGetter('common', 'autoHidePlayBar')
  const componentIds = useGetter('common', 'componentIds')


  const playerComponent = useMemo(() => (
    <View style={{ ...styles.container, backgroundColor: theme.primary }}>
      <View style={styles.left} elevation={1}><Pic /></View>
      <View style={styles.center}>
        <View style={{ ...styles.row, justifyContent: 'space-between', fontSize: 12 }}>
          <Title />
          {/* <PlayTime /> */}
        </View>
        {componentIds.playDetail ? null : <PlayInfo />}
      </View>
      <View style={styles.right}>
        <ControlBtn />
      </View>
    </View>
  ), [theme, componentIds])

  // console.log(layout)

  return autoHidePlayBar && keyboardShown ? null : playerComponent
})

const styles = StyleSheet.create({
  container: {
    width: '100%',
    // height: 59,
    // paddingTop: progressContentPadding,
    // marginTop: -progressContentPadding,
    // backgroundColor: 'rgba(0, 0, 0, .1)',
    // borderTopWidth: BorderWidths.normal2,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 5,
    // backgroundColor: AppColors.primary,
    // backgroundColor: 'red',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 10,
  },
  left: {
    borderRadius: 3,
    flexGrow: 0,
    flexShrink: 0,
  },
  center: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 5,
    height: '100%',
    // justifyContent: 'space-evenly',
    // height: 48,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    paddingLeft: 5,
    paddingRight: 5,
  },
  row: {
    flexDirection: 'row',
    flexGrow: 0,
    flexShrink: 0,
  },
})
