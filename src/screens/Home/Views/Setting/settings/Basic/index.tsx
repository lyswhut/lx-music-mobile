import React, { memo } from 'react'

import Section from '../../components/Section'
import Theme from './Theme'
import Source from './Source'
import SourceName from './SourceName'
import Language from './Language'
import FontSize from './FontSize'
import ShareType from './ShareType'
import IsAutoTheme from './IsAutoTheme'
import IsStartupAutoPlay from './IsStartupAutoPlay'
import IsAutoHidePlayBar from './IsAutoHidePlayBar'
import DrawerLayoutPosition from './DrawerLayoutPosition'
import { useI18n } from '@/lang/i18n'

export default memo(() => {
  const t = useI18n()


  return (
    <Section title={t('setting_basic')}>
      <Theme />
      <IsAutoTheme />
      <IsStartupAutoPlay />
      <IsAutoHidePlayBar />
      <Source />
      <SourceName />
      <DrawerLayoutPosition />
      <Language />
      <FontSize />
      <ShareType />
    </Section>
  )
})
