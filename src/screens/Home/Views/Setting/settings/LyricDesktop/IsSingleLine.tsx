import React, { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'


import CheckBoxItem from '../../components/CheckBoxItem'
import { setDesktopLyricSingleLine } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const isSingleLine = useSettingValue('desktopLyric.isSingleLine')
  const update = (isSingleLine: boolean) => {
    void setDesktopLyricSingleLine(isSingleLine).then(() => {
      updateSetting({ 'desktopLyric.isSingleLine': isSingleLine })
    })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isSingleLine} onChange={update} label={t('setting_lyric_desktop_single_line')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
    marginBottom: 15,
  },
})
