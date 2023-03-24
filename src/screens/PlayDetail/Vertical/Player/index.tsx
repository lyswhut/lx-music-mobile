import React, { memo } from 'react'
import { View } from 'react-native'

// import Title from './components/Title'
import MoreBtn from './components/MoreBtn'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'


export default memo(() => {
  return (
    <View style={styles.container} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}>
      <View style={styles.status}>
        <PlayInfo />
      </View>
      <View style={styles.control}>
        <ControlBtn />
      </View>
      <View style={{ ...styles.info }} >
        <MoreBtn />
      </View>
    </View>
  )
})

const styles = createStyle({
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
    paddingBottom: 5,
    justifyContent: 'flex-end',
  },
  status: {
    marginTop: 10,
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
    paddingLeft: '10%',
    paddingRight: '10%',
    paddingTop: '8.6%',
    paddingBottom: '8.6%',
  },
  row: {
    flexDirection: 'row',
    flexGrow: 0,
    flexShrink: 0,
  },
})
