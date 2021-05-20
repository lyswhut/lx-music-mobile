import React, { memo, useMemo } from 'react'
import { StyleSheet, Text } from 'react-native'

import DorpDownMenu from '@/components/common/DorpDownMenu'
import { useGetter, useDispatch } from '@/store'
import { useTranslation } from '@/plugins/i18n'


export default memo(() => {
  const setSearchSource = useDispatch('common', 'setSearchSource')
  const sourceList = useGetter('search', 'sources')
  const searchSource = useGetter('search', 'searchSource')
  const sourceNameType = useGetter('common', 'sourceNameType')
  const theme = useGetter('common', 'theme')
  // const currentSourceName = useGetter('search', 'currentSourceName')
  const { t } = useTranslation()

  const sourceList_t = useMemo(() => {
    return sourceList.map(s => ({ label: t(`source_${sourceNameType}_${s.id}`), action: s.id }))
  }, [sourceNameType, sourceList, t])

  return (
    <DorpDownMenu
      menus={sourceList_t}
      width={80}
      onPress={({ action }) => setSearchSource({ searchSource: action })}
    >
      <Text style={{ ...styles.sourceMenu, color: theme.normal }}>{t(`source_${sourceNameType}_${searchSource}`)}</Text>
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
