import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import React, { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isPlayHighQuality = useSettingValue('player.isPlayHighQuality')
  const setPlayHighQuality = (isPlayHighQuality: boolean) => {
    updateSetting({ 'player.isPlayHighQuality': isPlayHighQuality })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isPlayHighQuality} onChange={setPlayHighQuality} label={t('setting_play_quality')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})

