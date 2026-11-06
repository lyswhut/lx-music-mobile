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
      <Text numberOfLines={1} style={styles.titleName} color={theme['c-font-label']}>{musicInfo.name}</Text>
      <Text numberOfLines={1} style={styles.titleSinger} size={12} color={theme['c-font-label']}>{musicInfo.singer}</Text>
    </View>
  )
}

export default memo(() => {
  const popupRef = useRef<SettingPopupType>(null)
  const statusBarHeight = useStatusbarHeight()
  const theme = useTheme()

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
        <Btn icon="chevron-left" color={theme['c-font-label']} onPress={back} />
        <Title />
        <TimeoutExitBtn />
        <Btn icon="slider" color={theme['c-font-label']} onPress={showSetting} />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 5,
    marginRight: 8,
    // alignItems: 'center',
    justifyContent: 'flex-start',
  },
  titleName: {
    flexShrink: 1,
  },
  titleSinger: {
    flexShrink: 1,
    marginLeft: 6,
  },
  icon: {
    paddingLeft: 4,
    paddingRight: 4,
  },
})
