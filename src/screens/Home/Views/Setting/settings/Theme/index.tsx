import React, { memo } from 'react'

import Section from '../../components/Section'
import Theme from './Theme'
import IsAutoTheme from './IsAutoTheme'
import { useI18n } from '@/lang/i18n'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_theme')}>
      <Theme />
      <IsAutoTheme />
    </Section>
  )
})
