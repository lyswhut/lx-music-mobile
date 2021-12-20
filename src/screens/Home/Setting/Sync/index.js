import React, { memo, useState } from 'react'

import Section from '../components/Section'
import IsEnable from './IsEnable'
import History from './History'
// import SyncHost from './SyncHost'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()

  const [hostInfo, setHostInfo] = useState({ host: '', port: '' })
  const [isWaiting, setIsWaiting] = useState(global.isSyncEnableing)

  return (
    <Section title={t('setting_sync')}>
      <IsEnable hostInfo={hostInfo} setHostInfo={setHostInfo} isWaiting={isWaiting} setIsWaiting={setIsWaiting} />
      <History setHostInfo={setHostInfo} isWaiting={isWaiting} />
    </Section>
  )
})
