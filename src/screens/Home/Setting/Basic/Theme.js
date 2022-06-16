import React, { memo, useCallback, useMemo } from 'react'

import { StyleSheet, View, Text, ImageBackground, TouchableOpacity, InteractionManager } from 'react-native'
import { useGetter, useDispatch } from '@/store'

import SubTitle from '../components/SubTitle'
import { useTranslation } from '@/plugins/i18n'

const useActive = id => {
  const activeThemeId = useGetter('common', 'activeThemeId')
  const isActive = useMemo(() => activeThemeId == id, [activeThemeId, id])
  return isActive
}

const ThemeItem = ({ id, color, image, setTheme }) => {
  const theme = useGetter('common', 'theme')
  const isActive = useActive(id)
  const { t } = useTranslation()
  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.5} onPress={() => setTheme(id)}>
      <View style={{ ...styles.colorContent, backgroundColor: theme.primary, borderColor: isActive ? color : 'transparent' }}>
        {
          image
            ? <ImageBackground source={image} style={styles.image} />
            : <View style={{ ...styles.image, backgroundColor: color }}></View>
        }
      </View>
      <Text style={{ ...styles.name, color: isActive ? color : theme.normal }} numberOfLines={1}>{t(`theme_${id}`)}</Text>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const { t } = useTranslation()
  const themeList = useGetter('common', 'themeList')
  const themes = useMemo(() => themeList.map(theme => ({ id: theme.id, color: theme.colors.secondary })), [themeList])
  const setTheme = useDispatch('common', 'setTheme')
  const setThemeId = useCallback((id) => {
    InteractionManager.runAfterInteractions(() => {
      setTheme(id)
    })
  }, [setTheme])

  return (
    <SubTitle title={t('setting_basic_theme')}>
      <View style={styles.list}>
        {
          themes.map(({ id, color, image }) => <ThemeItem key={id} color={color} image={image} id={id} setTheme={setThemeId} />)
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
    alignItems: 'center',
    width: 54,
    marginTop: 5,
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  colorContent: {
    width: 32,
    height: 32,
    borderRadius: 4,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 26,
    height: 26,
    borderRadius: 4,
    elevation: 1,
  },
  name: {
    marginTop: 2,
    fontSize: 13,
  },
})
