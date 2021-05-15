import React, { memo, useMemo } from 'react'
import { StyleSheet, Text } from 'react-native'

import DorpDownMenu from '@/components/common/DorpDownMenu'
import { useGetter, useDispatch } from '@/store'
import { useTranslation } from '@/plugins/i18n'


export default memo(({ layout }) => {
  const setTop = useDispatch('common', 'setTop')
  const sourceNameType = useGetter('common', 'sourceNameType')
  const sourceList = useGetter('top', 'sources')
  const sourceId = useGetter('top', 'sourceId')
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
      <Text style={styles.sourceMenu}>{t(`source_${sourceNameType}_${sourceId}`)}</Text>
    </DorpDownMenu>
  )
})


const styles = StyleSheet.create({
  sourceMenu: {
    height: 38,
    lineHeight: 38,
    paddingLeft: 10,
    paddingRight: 10,
    // textAlign: 'center',
    // width: 80,
  },
})
