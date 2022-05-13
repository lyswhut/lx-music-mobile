import React, { memo, useCallback, useState } from 'react'

import { StyleSheet, View, Text } from 'react-native'
import { useGetter, useDispatch } from '@/store'

import SubTitle from '../components/SubTitle'
import Slider from '../components/Slider'
import { useTranslation } from '@/plugins/i18n'


export default memo(() => {
  const { t } = useTranslation()
  const maxLineNum = useGetter('common', 'desktopLyricMaxLineNum')
  const setDesktopLyricMaxLineNum = useDispatch('common', 'setDesktopLyricMaxLineNum')
  const theme = useGetter('common', 'theme')
  const [sliderSize, setSliderSize] = useState(maxLineNum)
  const [isSliding, setSliding] = useState(false)
  const handleSlidingStart = useCallback(value => {
    setSliding(true)
  }, [])
  const handleValueChange = useCallback(value => {
    setSliderSize(value)
  }, [])
  const handleSlidingComplete = useCallback(value => {
    if (maxLineNum == value) return
    setDesktopLyricMaxLineNum(value)
    setSliding(false)
  }, [maxLineNum, setDesktopLyricMaxLineNum])

  return (
    <SubTitle title={t('setting_lyric_desktop_maxlineNum')}>
      <View style={styles.content}>
        <Text style={{ color: theme.secondary10 }}>{isSliding ? sliderSize : maxLineNum}</Text>
        <Slider
          minimumValue={1}
          maximumValue={8}
          onSlidingComplete={handleSlidingComplete}
          onValueChange={handleValueChange}
          onSlidingStart={handleSlidingStart}
          step={1}
          value={maxLineNum}
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
