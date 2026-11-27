import { useState } from 'react'

import { View } from 'react-native'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import Slider, { type SliderProps } from '@/components/common/Slider'
import styles from './style'

// 逐字歌词高亮亮度：100% 为原色，大于 100 向白色提亮，小于 100 向黑色压暗
export default () => {
  const t = useI18n()
  const theme = useTheme()
  const brightness = useSettingValue('player.wordLyricBrightness')
  const [sliderValue, setSliderValue] = useState(brightness)
  const [isSliding, setSliding] = useState(false)

  const handleSlidingStart: SliderProps['onSlidingStart'] = () => {
    setSliding(true)
  }
  const handleValueChange: SliderProps['onValueChange'] = value => {
    setSliderValue(value)
  }
  const handleSlidingComplete: SliderProps['onSlidingComplete'] = value => {
    setSliding(false)
    if (brightness == value) return
    updateSetting({ 'player.wordLyricBrightness': value })
  }

  return (
    <View style={styles.container}>
      <Text>{t('play_detail_setting_word_lyric_brightness')}</Text>
      <View style={styles.content}>
        <Text style={styles.label} color={theme['c-font-label']}>{isSliding ? sliderValue : brightness}%</Text>
        <Slider
          minimumValue={50}
          maximumValue={150}
          onSlidingComplete={handleSlidingComplete}
          onValueChange={handleValueChange}
          onSlidingStart={handleSlidingStart}
          step={5}
          value={brightness}
        />
      </View>
    </View>
  )
}
