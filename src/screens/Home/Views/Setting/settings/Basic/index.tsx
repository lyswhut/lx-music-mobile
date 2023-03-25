import React, { memo } from 'react'

import Section from '../../components/Section'
import Source from './Source'
import SourceName from './SourceName'
import Language from './Language'
import FontSize from './FontSize'
import ShareType from './ShareType'
import IsStartupAutoPlay from './IsStartupAutoPlay'
import IsAutoHidePlayBar from './IsAutoHidePlayBar'
import IsShowBackBtn from './IsShowBackBtn'
import DrawerLayoutPosition from './DrawerLayoutPosition'
import { useI18n } from '@/lang/i18n'

export default memo(() => {
  const t = useI18n()


  return (
    <Section title={t('setting_basic')}>
      <IsStartupAutoPlay />
      <IsShowBackBtn />
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
