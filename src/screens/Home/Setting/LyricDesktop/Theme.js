import React, { memo, useMemo } from 'react'

import { StyleSheet, View, TouchableOpacity } from 'react-native'
import { useGetter, useDispatch } from '@/store'

import SubTitle from '../components/SubTitle'
import { useTranslation } from '@/plugins/i18n'
import { themes } from '@/utils/lyricDesktop'

const useActive = id => {
  const themeDesktopLyric = useGetter('common', 'themeDesktopLyric')
  const isActive = useMemo(() => themeDesktopLyric == id, [themeDesktopLyric, id])
  return isActive
}

const ThemeItem = ({ id, color, setTheme }) => {
  const theme = useGetter('common', 'theme')
  const isActive = useActive(id)
  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.5} onPress={() => setTheme(id)}>
      <View style={{ ...styles.colorContent, backgroundColor: theme.primary, borderColor: isActive ? color : 'transparent' }}>
        <View style={{ ...styles.image, backgroundColor: color }}></View>
      </View>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const { t } = useTranslation()
  const setThemeDesktopLyric = useDispatch('common', 'setThemeDesktopLyric')

  return (
    <SubTitle title={t('setting_lyric_desktop_theme')}>
      <View style={styles.list}>
        {
          themes.map(({ id, value }) => <ThemeItem key={id} color={value} id={id} setTheme={setThemeDesktopLyric} />)
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
    borderWidth: 1.6,
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
