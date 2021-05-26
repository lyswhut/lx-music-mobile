import React, { memo, useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import DorpDownMenu from '@/components/common/DorpDownMenu'
import { useGetter, useDispatch } from '@/store'
import { useTranslation } from '@/plugins/i18n'
import { useLayout } from '@/utils/hooks'


export default memo(() => {
  const setSearchSource = useDispatch('common', 'setSearchSource')
  const sourceList = useGetter('search', 'sources')
  const searchSource = useGetter('search', 'searchSource')
  const sourceNameType = useGetter('common', 'sourceNameType')
  const theme = useGetter('common', 'theme')
  // const currentSourceName = useGetter('search', 'currentSourceName')
  const { t } = useTranslation()
  const { onLayout, ...layout } = useLayout()

  const sourceList_t = useMemo(() => {
    return sourceList.map(s => ({ label: t(`source_${sourceNameType}_${s.id}`), action: s.id }))
  }, [sourceNameType, sourceList, t])

  return (
    <DorpDownMenu
      menus={sourceList_t}
      width={layout.width}
      onPress={({ action }) => setSearchSource({ searchSource: action })}
    >
      <View style={styles.sourceMenu} onLayout={onLayout}>
        <Text style={{ color: theme.normal }}>{t(`source_${sourceNameType}_${searchSource}`)}</Text>
      </View>
    </DorpDownMenu>
  )
})


const styles = StyleSheet.create({
  sourceMenu: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    // width: 80,
  },
})
