import React, { memo, useMemo, useCallback } from 'react'
import { StyleSheet, Text } from 'react-native'

import DorpDownMenu from '@/components/common/DorpDownMenu'
import { useGetter, useDispatch } from '@/store'
import { useTranslation } from '@/plugins/i18n'


export default memo(() => {
  const setSongList = useDispatch('common', 'setSongList')
  const sources = useGetter('songList', 'sources')
  const songListSource = useGetter('songList', 'songListSource')
  // const currentSourceName = useGetter('search', 'currentSourceName')
  const { t } = useTranslation()
  const sortList = useGetter('songList', 'sortList')
  const sourceNameType = useGetter('common', 'sourceNameType')
  const theme = useGetter('common', 'theme')

  const sources_t = useMemo(() => {
    return sources.map(s => ({ label: t(`source_${sourceNameType}_${s.id}`), action: s.id }))
  }, [sourceNameType, sources, t])

  const handleSetSource = useCallback(({ action }) => {
    const sorts = sortList[action]
    setSongList({ source: action, sortId: sorts ? sorts[0].id : '', tagInfo: { name: '默认', id: null } })
  }, [setSongList, sortList])

  return (
    <DorpDownMenu
      menus={sources_t}
      width={80}
      onPress={handleSetSource}
    >
      <Text style={{ ...styles.sourceMenu, color: theme.normal }}>{t(`source_${sourceNameType}_${songListSource}`)}</Text>
    </DorpDownMenu>
  )
})


const styles = StyleSheet.create({
  sourceMenu: {
    height: 38,
    lineHeight: 38,
    textAlign: 'center',
    width: 80,
  },
})
