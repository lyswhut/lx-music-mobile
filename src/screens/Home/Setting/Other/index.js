import React, { memo } from 'react'

import Section from '../components/Section'
import Cache from './Cache'
// import MaxCache from './MaxCache'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()

  return (
    <Section title={t('setting_other')}>
      <Cache />
      {/* <MaxCache /> */}
    </Section>
  )
})
