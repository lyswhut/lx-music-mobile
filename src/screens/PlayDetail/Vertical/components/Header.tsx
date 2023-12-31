import { memo, useRef } from 'react'

import { View, StyleSheet } from 'react-native'

import { pop } from '@/navigation'
import StatusBar from '@/components/common/StatusBar'
import { useTheme } from '@/store/theme/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'
import { useStatusbarHeight } from '@/store/common/hook'
import Btn from './Btn'
import TimeoutExitBtn from './TimeoutExitBtn'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)


const Title = () => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()


  return (
    <View style={styles.titleContent}>
      <Text numberOfLines={1} style={styles.title}>{musicInfo.name}</Text>
      <Text numberOfLines={1} style={styles.title} size={12} color={theme['c-font-label']}>{musicInfo.singer}</Text>
    </View>
  )
}

export default memo(() => {
  const popupRef = useRef<SettingPopupType>(null)
  const statusBarHeight = useStatusbarHeight()

  const back = () => {
    void pop(commonState.componentIds.playDetail!)
  }
  const showSetting = () => {
    popupRef.current?.show()
  }

  return (
    <View style={{ height: HEADER_HEIGHT + statusBarHeight, paddingTop: statusBarHeight }} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}>
      <StatusBar />
      <View style={styles.container}>
        <Btn icon="chevron-left" onPress={back} />
        <Title />
        <TimeoutExitBtn />
        <Btn icon="slider" onPress={showSetting} />
      </View>
      <SettingPopup ref={popupRef} direction="vertical" />
    </View>
  )
})


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    // justifyContent: 'center',
    height: '100%',
  },
  titleContent: {
    flex: 1,
    paddingHorizontal: 5,
    // alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    // flex: 1,
    // textAlign: 'center',
  },
  icon: {
    paddingLeft: 4,
    paddingRight: 4,
  },
})
