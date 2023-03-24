import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import React, { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isS2t = useSettingValue('player.isS2t')
  const setS2T = (isS2t: boolean) => {
    updateSetting({ 'player.isS2t': isS2t })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isS2t} onChange={setS2T} label={t('setting_play_s2t')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})

