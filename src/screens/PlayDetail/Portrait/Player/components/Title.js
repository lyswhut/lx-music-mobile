import React, { useCallback, memo, useMemo, useEffect } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useGetter, useDispatch } from '@/store'
import { useTranslation } from '@/plugins/i18n'

export default () => {
  const theme = useGetter('common', 'theme')
  const playMusicInfo = useGetter('player', 'playMusicInfo')
  const { t } = useTranslation()
  const titleInfo = useMemo(() => {
    const info = {
      name: '',
      singer: '',
    }
    if (playMusicInfo) {
      info.name = t('name', { name: playMusicInfo.musicInfo.name })
      info.singer = t('singer', { name: playMusicInfo.musicInfo.singer })
    }
    return info
  }, [playMusicInfo, t])
  // console.log(playMusicInfo)
  return (
    <View style={styles.container}>
      <Text style={{ width: '100%', fontSize: 14, color: theme.normal20 }} numberOfLines={2}>{titleInfo.name}</Text>
      <Text style={{ width: '100%', fontSize: 14, color: theme.normal20 }} numberOfLines={2}>{titleInfo.singer}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexShrink: 1,
    flexGrow: 1,
  },
})
