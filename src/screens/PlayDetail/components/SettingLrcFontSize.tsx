import React, { useState } from 'react'

import { View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { useSettingValue } from '@/store/setting/hook'
import Slider, { type SliderProps } from '@/components/common/Slider'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import styles from './style'


const LrcFontSize = () => {
  const theme = useTheme()
  const lrcFontSize = useSettingValue('player.vertical.style.lrcFontSize')
  const [sliderSize, setSliderSize] = useState(lrcFontSize)
  const [isSliding, setSliding] = useState(false)
  const t = useI18n()

  const handleSlidingStart: SliderProps['onSlidingStart'] = value => {
    setSliding(true)
  }
  const handleValueChange: SliderProps['onValueChange'] = value => {
    setSliderSize(value)
  }
  const handleSlidingComplete: SliderProps['onSlidingComplete'] = value => {
    setSliding(false)
    if (lrcFontSize == value) return
    updateSetting({ 'player.vertical.style.lrcFontSize': value })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('player_setting_lrc_font_size')}</Text>
      <View style={styles.content}>
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
    </View>
  )
}

export default LrcFontSize
