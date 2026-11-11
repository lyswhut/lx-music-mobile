import { memo, useCallback, useState } from 'react'
import { View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import Slider, { type SliderProps } from '../../components/Slider'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'

// 逐字歌词高亮亮度：100% 为原色，大于 100 向白色提亮，小于 100 向黑色压暗
export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const brightness = useSettingValue('player.wordLyricBrightness')
  const [sliderValue, setSliderValue] = useState(brightness)
  const [isSliding, setSliding] = useState(false)
  const handleSlidingStart = useCallback<NonNullable<SliderProps['onSlidingStart']>>(() => {
    setSliding(true)
  }, [])
  const handleValueChange = useCallback<NonNullable<SliderProps['onValueChange']>>(value => {
    setSliderValue(value)
  }, [])
  const handleSlidingComplete = useCallback<NonNullable<SliderProps['onSlidingComplete']>>(value => {
    setSliding(false)
    if (brightness == value) return
    updateSetting({ 'player.wordLyricBrightness': value })
  }, [brightness])

  return (
    <SubTitle title={t('setting_play_word_lyric_brightness')}>
      <View style={styles.content}>
        <Text style={{ color: theme['c-primary-font'] }}>{isSliding ? sliderValue : brightness}%</Text>
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
    </SubTitle>
  )
})

const styles = createStyle({
  content: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
})
