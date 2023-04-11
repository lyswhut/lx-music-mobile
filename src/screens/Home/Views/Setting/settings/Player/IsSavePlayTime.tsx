import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import React, { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isSavePlayTime = useSettingValue('player.isSavePlayTime')
  const setSavePlayTime = (isSavePlayTime: boolean) => {
    updateSetting({ 'player.isSavePlayTime': isSavePlayTime })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isSavePlayTime} label={t('setting_player_save_play_time')} onChange={setSavePlayTime} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
