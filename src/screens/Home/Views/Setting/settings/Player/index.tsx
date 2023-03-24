import React, { memo } from 'react'

import Section from '../../components/Section'
import IsSavePlayTime from './IsSavePlayTime'
import IsPlayHighQuality from './IsPlayHighQuality'
import IsHandleAudioFocus from './IsHandleAudioFocus'
import IsShowNotificationImage from './IsShowNotificationImage'
import IsShowLyricTranslation from './IsShowLyricTranslation'
import IsShowLyricRoma from './IsShowLyricRoma'
import IsS2T from './IsS2T'
import MaxCache from './MaxCache'
import { useI18n } from '@/lang'


export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_player')}>
      <IsSavePlayTime />
      <IsPlayHighQuality />
      <IsHandleAudioFocus />
      <IsShowNotificationImage />
      <IsShowLyricTranslation />
      <IsShowLyricRoma />
      <IsS2T />
      <MaxCache />
    </Section>
  )
})
