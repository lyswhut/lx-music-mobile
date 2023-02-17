import React, { memo } from 'react'

import Section from '../components/Section'
import Cache from './Cache'
// import Log from './Log'
// import MaxCache from './MaxCache'
import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_other')}>
      <Cache />
      {/* <Log /> */}
      {/* <MaxCache /> */}
    </Section>
  )
})
