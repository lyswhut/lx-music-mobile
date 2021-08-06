import React, { memo } from 'react'

import Section from '../components/Section'
import IsShowLyric from './IsShowLyric'
import IsLockLyric from './IsLockLyric'
import TextPositionX from './TextPositionX'
import TextPositionY from './TextPositionY'
import Theme from './Theme'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()

  return (
    <Section title={t('setting_lyric_desktop')}>
      <IsShowLyric />
      <IsLockLyric />
      <TextPositionX />
      <TextPositionY />
      <Theme />
    </Section>
  )
})
