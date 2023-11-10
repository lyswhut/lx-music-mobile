import { memo } from 'react'
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
      <ControlBtn />
      <View style={{ ...styles.info }} >
        <MoreBtn />
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    width: '100%',
    // paddingTop: progressContentPadding,
    // marginTop: -progressContentPadding,
    // backgroundColor: 'rgba(0, 0, 0, .1)',
    padding: 15,
    // backgroundColor: AppColors.primary,
    // backgroundColor: 'red',
    flexDirection: 'column',
  },
  info: {
    flex: 0,
    flexDirection: 'row',
    paddingBottom: 5,
    // justifyContent: 'flex-end',
  },
  status: {
    marginTop: 10,
    flexDirection: 'column',
    flex: 0,
    paddingLeft: 5,
    justifyContent: 'space-evenly',
    // backgroundColor: 'rgba(0, 0, 0, .1)',
  },
})
