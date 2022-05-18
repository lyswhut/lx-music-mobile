import React, { memo, useCallback, useState } from 'react'

import { StyleSheet, View, Text } from 'react-native'
import { useGetter, useDispatch } from '@/store'

import SubTitle from '../components/SubTitle'
import Slider from '../components/Slider'
import { useTranslation } from '@/plugins/i18n'


export default memo(() => {
  const { t } = useTranslation()
  const { fontSize } = useGetter('common', 'desktopLyricStyle')
  const setDesktopLyricStyle = useDispatch('common', 'setDesktopLyricStyle')
  const theme = useGetter('common', 'theme')
  const [sliderSize, setSliderSize] = useState(fontSize)
  const [isSliding, setSliding] = useState(false)
  const handleSlidingStart = useCallback(value => {
    setSliding(true)
  }, [])
  const handleValueChange = useCallback(value => {
    setSliderSize(value)
  }, [])
  const handleSlidingComplete = useCallback(value => {
    if (fontSize == value) return
    setDesktopLyricStyle({ fontSize: value })
    setSliding(false)
  }, [fontSize, setDesktopLyricStyle])

  return (
    <SubTitle title={t('setting_lyric_desktop_text_size')}>
      <View style={styles.content}>
        <Text style={{ color: theme.secondary10 }}>{isSliding ? sliderSize : fontSize}</Text>
        <Slider
          minimumValue={100}
          maximumValue={500}
          onSlidingComplete={handleSlidingComplete}
          onValueChange={handleValueChange}
          onSlidingStart={handleSlidingStart}
          step={2}
          value={fontSize}
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
