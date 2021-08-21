import React, { memo } from 'react'

import Slider from '@react-native-community/slider'
import { StyleSheet } from 'react-native'
import { useGetter } from '@/store'

export default memo(({ value, minimumValue, maximumValue, onSlidingStart, onSlidingComplete, onValueChange, step }) => {
  const theme = useGetter('common', 'theme')

  return (
    <Slider
      value={value}
      style={styles.slider}
      minimumValue={minimumValue}
      maximumValue={maximumValue}
      minimumTrackTintColor={theme.secondary30}
      maximumTrackTintColor={theme.secondary30}
      thumbTintColor={theme.secondary}
      onSlidingStart={onSlidingStart}
      onSlidingComplete={onSlidingComplete}
      onValueChange={onValueChange}
      step={step}
    />
  )
})


const styles = StyleSheet.create({
  slider: {
    flexShrink: 0,
    flexGrow: 1,
    // width: '100%',
    maxWidth: 300,
    height: 40,
    marginTop: -6,
  },
})
