import React, { memo, useRef, useState } from 'react'

import { View, StyleSheet, TouchableOpacity } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { pop } from '@/navigation'
// import { AppColors } from '@/theme'
// import commonState from '@/store/common/state'
import { useTheme } from '@/store/theme/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import { createStyle } from '@/utils/tools'
import { useSettingValue } from '@/store/setting/hook'
import Slider, { type SliderProps } from '@/components/common/Slider'
import { updateSetting } from '@/core/common'
import Popup, { type PopupType } from '@/components/common/Popup'
import { useI18n } from '@/lang'
import CommentBtn from './CommentBtn'
import Btn from './Btn'

const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

const LrcFontSizeStyles = createStyle({
  content: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 15,
  },
})
const LrcFontSize = () => {
  const theme = useTheme()
  const lrcFontSize = useSettingValue('player.horizontal.style.lrcFontSize')
  const [sliderSize, setSliderSize] = useState(lrcFontSize)
  const [isSliding, setSliding] = useState(false)

  const handleSlidingStart: SliderProps['onSlidingStart'] = value => {
    setSliding(true)
  }
  const handleValueChange: SliderProps['onValueChange'] = value => {
    setSliderSize(value)
  }
  const handleSlidingComplete: SliderProps['onSlidingComplete'] = value => {
    if (lrcFontSize == value) return
    updateSetting({ 'player.horizontal.style.lrcFontSize': value })
    setSliding(false)
  }

  return (
    <View style={LrcFontSizeStyles.content}>
      <Text color={theme['c-font-label']}>{isSliding ? sliderSize : lrcFontSize}</Text>
      <Slider
        minimumValue={100}
        maximumValue={300}
        onSlidingComplete={handleSlidingComplete}
        onValueChange={handleValueChange}
        onSlidingStart={handleSlidingStart}
        step={2}
        value={lrcFontSize}
      />
    </View>
  )
}

const Title = () => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()


  return (
    <View style={styles.titleContent}>
      <Text numberOfLines={1} style={styles.title} size={14}>{musicInfo.name}</Text>
      <Text numberOfLines={1} style={styles.title} size={12} color={theme['c-font-label']}>{musicInfo.singer}</Text>
    </View>
  )
}

export default memo(() => {
  const t = useI18n()
  // const theme = useTheme()

  // const [settingVisible, setSettingVisible] = useState(false)
  const popupRef = useRef<PopupType>(null)

  const back = () => {
    // navigation.goBack()
    void pop(commonState.componentIds.playDetail as string)
  }
  const showSetting = () => {
    popupRef.current?.setVisible(true)
  }

  return (
    <View style={{ height: HEADER_HEIGHT }} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}>
      <View style={styles.container}>
        <TouchableOpacity onPress={back} style={{ ...styles.button, width: HEADER_HEIGHT }}>
          <Icon name="chevron-left" size={18} />
        </TouchableOpacity>
        <Title />
        <CommentBtn />
        <Btn icon="font-size" onPress={showSetting} />
      </View>
      <Popup ref={popupRef} position="left" title={t('player_setting_lrc_font_size')}>
        <LrcFontSize />
      </Popup>
    </View>
  )
})


const styles = StyleSheet.create({
  container: {
    // backgroundColor: '#ccc',
    flexDirection: 'row',
    // justifyContent: 'center',
    height: '100%',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    flex: 0,
  },
  titleContent: {
    flex: 1,
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
