import React, { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'


import CheckBoxItem from '../../components/CheckBoxItem'
import { toggleDesktopLyricLock } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const isLock = useSettingValue('desktopLyric.isLock')
  const setLock = (isLock: boolean) => {
    void toggleDesktopLyricLock(isLock).then(() => {
      updateSetting({ 'desktopLyric.isLock': isLock })
    })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isLock} onChange={setLock} label={t('setting_lyric_desktop_lock')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
