import React, { memo } from 'react'

import Section from '../components/Section'
import Theme from './Theme'
import Source from './Source'
import SourceName from './SourceName'
import Language from './Language'
import ShareType from './ShareType'
import IsAutoTheme from './IsAutoTheme'
import IsStartupAutoPlay from './IsStartupAutoPlay'
import IsAutoHidePlayBar from './IsAutoHidePlayBar'
import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const { t } = useTranslation()


  return (
    <Section title={t('setting_basic')}>
      <Theme />
      <IsAutoTheme />
      <IsStartupAutoPlay />
      <IsAutoHidePlayBar />
      <Source />
      <Language />
      <SourceName />
      <ShareType />
    </Section>
  )
})
