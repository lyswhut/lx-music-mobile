import { updateSetting } from '@/core/common'
import { setDesktopLyricColor } from '@/core/desktopLyric'
import { useI18n } from '@/lang'
import React, { memo } from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'

import SubTitle from '../../components/SubTitle'

const themes = [
  '#07c556',
  '#fffa12',
  '#19b5fe',
  '#ff1222',
  '#f1828d',
  '#c851d4',
  '#ffad12',
  '#bdc3c7',
  '#333333',
  '#ffffff',
] as const

const ThemeItem = ({ color, change }: {
  color: string
  change: (color: string) => void
}) => {
  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.5} onPress={() => { change(color) }}>
      <View style={styles.colorContent}>
        <View style={{ ...styles.image, backgroundColor: color }}></View>
      </View>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const t = useI18n()

  const setThemeDesktopLyric = (color: string) => {
    const shadowColor = 'rgba(0,0,0,0.6)'
    void setDesktopLyricColor(null, color, shadowColor).then(() => {
      updateSetting({ 'desktopLyric.style.lyricPlayedColor': color, 'desktopLyric.style.lyricShadowColor': shadowColor })
    })
  }

  return (
    <SubTitle title={t('setting_lyric_desktop_theme')}>
      <View style={styles.list}>
        {
          themes.map(c => <ThemeItem key={c} color={c} change={setThemeDesktopLyric} />)
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    marginRight: 15,
    marginTop: 5,
    alignItems: 'center',
    width: 26,
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  colorContent: {
    width: 26,
    height: 26,
    borderRadius: 4,
    // borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 20,
    height: 20,
    borderRadius: 4,
    elevation: 1,
  },
})
