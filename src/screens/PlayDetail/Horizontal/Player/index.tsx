import React, { memo } from 'react'
import { View } from 'react-native'

// import Title from './components/Title'
import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import PlayInfo from './PlayInfo'
import MoreBtn from './MoreBtn'
import ControlBtn from './ControlBtn'


export default memo(() => {
  return (
    <View style={styles.container} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}>
      <View style={styles.controlBtn}>
        <MoreBtn />
        <ControlBtn />
      </View>
      <PlayInfo />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexShrink: 0,
    flexGrow: 0,
    // paddingLeft: 15,
    // paddingRight: 15,
  },
  controlBtn: {
    flexDirection: 'row',
    // alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingLeft: 5,
    // paddingBottom: 10,
  },
})
