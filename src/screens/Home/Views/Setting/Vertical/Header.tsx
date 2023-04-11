import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { TouchableOpacity } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { BorderWidths } from '@/theme'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { type SettingScreenIds } from '../Main'

export interface HeaderProps {
  onShowNavBar: () => void
}
export interface HeaderType {
  setActiveId: (id: SettingScreenIds) => void
}

export default forwardRef<HeaderType, HeaderProps>(({ onShowNavBar }, ref) => {
  const [activeId, setActiveId] = useState(global.lx.settingActiveId)
  const theme = useTheme()
  const t = useI18n()

  useImperativeHandle(ref, () => ({
    setActiveId(id) {
      setActiveId(id)
    },
  }))

  return (
    <TouchableOpacity onPress={onShowNavBar} style={{ ...styles.currentList, borderBottomColor: theme['c-border-background'] }}>
      <Icon style={styles.currentListIcon} color={theme['c-button-font']} name="chevron-right" size={12} />
      <Text numberOfLines={1} size={16} style={styles.currentListText} color={theme['c-button-font']}>{t(`setting_${activeId}`)}</Text>
    </TouchableOpacity>
  )
})


const styles = createStyle({
  currentList: {
    flexDirection: 'row',
    paddingRight: 2,
    height: 40,
    alignItems: 'center',
    borderBottomWidth: BorderWidths.normal,
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  currentListIcon: {
    paddingLeft: 15,
    paddingRight: 10,
    // paddingTop: 10,
    // paddingBottom: 0,
  },
  currentListText: {
    flex: 1,
    // minWidth: 70,
    // paddingLeft: 10,
    paddingRight: 10,
    // paddingTop: 10,
    // paddingBottom: 10,
  },
})
