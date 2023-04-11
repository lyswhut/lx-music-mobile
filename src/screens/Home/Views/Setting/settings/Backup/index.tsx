import { useI18n } from '@/lang'
import React, { memo } from 'react'

import Section from '../../components/Section'
import Part from './Part'
// import MaxCache from './MaxCache'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_backup')}>
      <Part />
      {/* <MaxCache /> */}
    </Section>
  )
})
