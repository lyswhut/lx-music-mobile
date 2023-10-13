import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle, toast } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isEnableAudioOffload = useSettingValue('player.isEnableAudioOffload')
  const setHandleAudioFocus = (isEnableAudioOffload: boolean) => {
    updateSetting({ 'player.isEnableAudioOffload': isEnableAudioOffload })
    toast(t('setting_play_handle_audio_focus_tip'))
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem
        check={isEnableAudioOffload}
        onChange={setHandleAudioFocus}
        helpDesc={t('setting_play_audio_offload_tip')}
        label={t('setting_play_audio_offload')}
      />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})

