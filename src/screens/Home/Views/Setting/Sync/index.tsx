import React, { memo, useState } from 'react'

import Section from '../components/Section'
import IsEnable from './IsEnable'
import History from './History'
import { useI18n } from '@/lang'
// import SyncHost from './SyncHost'

export default memo(() => {
  const t = useI18n()

  const [host, setHost] = useState('')
  const [isWaiting, setIsWaiting] = useState(global.lx.isSyncEnableing)

  return (
    <Section title={t('setting_sync')}>
      <IsEnable host={host} setHost={setHost} isWaiting={isWaiting} setIsWaiting={setIsWaiting} />
      <History setHost={setHost} isWaiting={isWaiting} />
    </Section>
  )
})
