import React, { useState } from 'react'

import { View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { useSettingValue } from '@/store/setting/hook'
import Slider, { type SliderProps } from '@/components/common/Slider'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import styles from './style'
import { setPlaybackRate } from '@/plugins/player'
import { setPlaybackRate as setLyricPlaybackRate } from '@/core/lyric'
import ButtonPrimary from '@/components/common/ButtonPrimary'


const Volume = () => {
  const theme = useTheme()
  const playbackRate = useSettingValue('player.playbackRate') * 100
  const [sliderSize, setSliderSize] = useState(playbackRate)
  const [isSliding, setSliding] = useState(false)
  const t = useI18n()

  const handleSlidingStart: SliderProps['onSlidingStart'] = value => {
    setSliding(true)
  }
  const handleValueChange: SliderProps['onValueChange'] = value => {
    value = Math.trunc(value)
    setSliderSize(value)
    void setPlaybackRate(parseFloat((value / 100).toFixed(2)))
  }
  const handleSlidingComplete: SliderProps['onSlidingComplete'] = value => {
    setSliding(false)
    value = Math.trunc(value)
    if (playbackRate == value) return
    const rate = value / 100
    void setLyricPlaybackRate(rate)
    updateSetting({ 'player.playbackRate': rate })
  }
  const handleReset = () => {
    setSliderSize(100)
    void setPlaybackRate(1)
    void setLyricPlaybackRate(1)
    updateSetting({ 'player.playbackRate': 1 })
  }

  return (
    <View style={styles.container}>
      <Text>{t('player_setting_playback_rate')}</Text>
      <View style={styles.content}>
        <Text style={styles.label} color={theme['c-font-label']}>{`${((isSliding ? sliderSize : playbackRate) / 100).toFixed(2)}x`}</Text>
        <Slider
          minimumValue={60}
          maximumValue={200}
          onSlidingComplete={handleSlidingComplete}
          onValueChange={handleValueChange}
          onSlidingStart={handleSlidingStart}
          step={1}
          value={playbackRate}
        />
      </View>
      <ButtonPrimary onPress={handleReset}>{t('player_setting_playback_rate_reset')}</ButtonPrimary>
    </View>
  )
}

export default Volume
