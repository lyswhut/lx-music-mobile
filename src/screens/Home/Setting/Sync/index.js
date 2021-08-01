import React, { memo } from 'react'

import Section from '../components/Section'
import IsEnable from './IsEnable'
// import SyncHost from './SyncHost'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()

  return (
    <Section title={t('setting_sync')}>
      <IsEnable />
      {/* <SyncHost /> */}
    </Section>
  )
})
