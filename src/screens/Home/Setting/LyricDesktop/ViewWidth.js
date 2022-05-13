import React, { memo, useCallback, useState } from 'react'

import { StyleSheet, View, Text } from 'react-native'
import { useGetter, useDispatch } from '@/store'

import SubTitle from '../components/SubTitle'
import Slider from '../components/Slider'
import { useTranslation } from '@/plugins/i18n'


export default memo(() => {
  const { t } = useTranslation()
  const width = useGetter('common', 'desktopLyricWidth')
  const setDesktopLyricWidth = useDispatch('common', 'setDesktopLyricWidth')
  const theme = useGetter('common', 'theme')
  const [sliderSize, setSliderSize] = useState(width)
  const [isSliding, setSliding] = useState(false)
  const handleSlidingStart = useCallback(value => {
    setSliding(true)
  }, [])
  const handleValueChange = useCallback(value => {
    setSliderSize(value)
  }, [])
  const handleSlidingComplete = useCallback(value => {
    if (width == value) return
    setDesktopLyricWidth(value)
    setSliding(false)
  }, [width, setDesktopLyricWidth])

  return (
    <SubTitle title={t('setting_lyric_desktop_view_width')}>
      <View style={styles.content}>
        <Text style={{ color: theme.secondary10 }}>{isSliding ? sliderSize : width}</Text>
        <Slider
          minimumValue={10}
          maximumValue={100}
          onSlidingComplete={handleSlidingComplete}
          onValueChange={handleValueChange}
          onSlidingStart={handleSlidingStart}
          step={1}
          value={width}
        />
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  content: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
})
