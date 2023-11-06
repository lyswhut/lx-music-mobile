import { memo } from 'react'
import { View } from 'react-native'

// import Title from './components/Title'
import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import PlayInfo from './PlayInfo'
import ControlBtn from './ControlBtn'


export default memo(() => {
  return (
    <View style={styles.container} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}>
      <View style={styles.controlBtn}>
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
    paddingLeft: 15,
    // paddingRight: 15,
    // backgroundColor: 'rgba(0,0,0,0.1)',

  },
  controlBtn: {
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: 'row',
    // alignItems: 'flex-end',
    justifyContent: 'center',
    paddingTop: 8,
    // paddingLeft: 5,
    // paddingBottom: 10,
  },
})
