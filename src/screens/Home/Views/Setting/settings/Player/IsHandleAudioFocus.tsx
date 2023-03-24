import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle, toast } from '@/utils/tools'
import React, { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isHandleAudioFocus = useSettingValue('player.isHandleAudioFocus')
  const setHandleAudioFocus = (isHandleAudioFocus: boolean) => {
    updateSetting({ 'player.isHandleAudioFocus': isHandleAudioFocus })
    toast(t('setting_play_handle_audio_focus_tip'))
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isHandleAudioFocus} onChange={setHandleAudioFocus} label={t('setting_play_handle_audio_focus')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})

