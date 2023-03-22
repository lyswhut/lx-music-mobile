import React, { memo, useMemo } from 'react'
import { View } from 'react-native'
import { useKeyboard } from '@/utils/hooks'

import Pic from './Pic'
import Title from './Title'
import PlayInfo from './PlayInfo'
import ControlBtn from './ControlBtn'
import { createStyle } from '@/utils/tools'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'


export default memo(() => {
  // const { onLayout, ...layout } = useLayout()
  const { keyboardShown } = useKeyboard()
  const theme = useTheme()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')

  // console.log('render pb')
  const playerComponent = useMemo(() => (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}>
      <Pic />
      <View style={styles.center}>
        <Title />
        {/* <View style={{ ...styles.row, justifyContent: 'space-between' }}>
          <PlayTime />
        </View> */}
        <PlayInfo />
      </View>
      <View style={styles.right}>
        <ControlBtn />
      </View>
    </View>
  ), [theme])

  return autoHidePlayBar && keyboardShown ? null : playerComponent
})


const styles = createStyle({
  container: {
    width: '100%',
    // height: 100,
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
    // borderRadius: 3,
    flexGrow: 0,
    flexShrink: 0,
  },
  center: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 5,
    // height: '100%',
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
  // row: {
  //   flexDirection: 'row',
  //   flexGrow: 0,
  //   flexShrink: 0,
  // },
})
