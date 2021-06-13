import React, { memo } from 'react'
import { View } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import CheckBoxItem from '../components/CheckBoxItem'
import { useTranslation } from '@/plugins/i18n'
import { toast } from '@/utils/tools'

export default memo(() => {
  const { t } = useTranslation()
  const isHandleAudioFocus = useGetter('common', 'isHandleAudioFocus')
  const setIsHandleAudioFocus = useDispatch('common', 'setIsHandleAudioFocus')

  const handleSetAudioFocus = flag => {
    setIsHandleAudioFocus(flag)
    toast(t('setting_play_handle_audio_focus_tip'))
  }

  return (
    <View style={{ marginTop: 15 }}>
      <CheckBoxItem check={isHandleAudioFocus} label={t('setting_play_handle_audio_focus')} onChange={handleSetAudioFocus} />
    </View>
  )
})
