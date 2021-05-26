import React, { memo, useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import DorpDownMenu from '@/components/common/DorpDownMenu'
import { useGetter, useDispatch } from '@/store'
import { useTranslation } from '@/plugins/i18n'


export default memo(({ layout }) => {
  const setTop = useDispatch('common', 'setTop')
  const sourceNameType = useGetter('common', 'sourceNameType')
  const sourceList = useGetter('top', 'sources')
  const sourceId = useGetter('top', 'sourceId')
  const theme = useGetter('common', 'theme')
  // const currentSourceName = useGetter('search', 'currentSourceName')
  const { t } = useTranslation()

  const sourceList_t = useMemo(() => {
    return sourceList.map(s => ({ label: t(`source_${sourceNameType}_${s.id}`), action: s.id }))
  }, [sourceNameType, sourceList, t])

  return (
    <DorpDownMenu
      menus={sourceList_t}
      width={layout.width}
      onPress={({ action }) => setTop({ source: action })}
    >
      <View style={styles.sourceMenu}>
        <Text style={{ color: theme.normal }} numberOfLines={1}>{t(`source_${sourceNameType}_${sourceId}`)}</Text>
      </View>
    </DorpDownMenu>
  )
})


const styles = StyleSheet.create({
  sourceMenu: {
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 10,
    paddingRight: 10,
  },
})
