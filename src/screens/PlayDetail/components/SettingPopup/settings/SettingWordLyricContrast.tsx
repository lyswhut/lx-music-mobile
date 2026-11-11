import { useState } from 'react'

import { View } from 'react-native'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import Slider, { type SliderProps } from '@/components/common/Slider'
import styles from './style'

// 逐字歌词未唱部分对比度：0=与亮部同色，100=中性灰（与亮部差异最大）
export default () => {
  const t = useI18n()
  const theme = useTheme()
  const contrast = useSettingValue('player.wordLyricContrast')
  const [sliderValue, setSliderValue] = useState(contrast)
  const [isSliding, setSliding] = useState(false)

  const handleSlidingStart: SliderProps['onSlidingStart'] = () => {
    setSliding(true)
  }
  const handleValueChange: SliderProps['onValueChange'] = value => {
    setSliderValue(value)
  }
  const handleSlidingComplete: SliderProps['onSlidingComplete'] = value => {
    setSliding(false)
    if (contrast == value) return
    updateSetting({ 'player.wordLyricContrast': value })
  }

  return (
    <View style={styles.container}>
      <Text>{t('play_detail_setting_word_lyric_contrast')}</Text>
      <View style={styles.content}>
        <Text style={styles.label} color={theme['c-font-label']}>{isSliding ? sliderValue : contrast}%</Text>
        <Slider
          minimumValue={0}
          maximumValue={100}
          onSlidingComplete={handleSlidingComplete}
          onValueChange={handleValueChange}
          onSlidingStart={handleSlidingStart}
          step={5}
          value={contrast}
        />
      </View>
    </View>
  )
}
