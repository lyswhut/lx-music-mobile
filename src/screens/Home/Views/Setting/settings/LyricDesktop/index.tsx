import { memo } from 'react'

import Section from '../../components/Section'
import IsShowLyric from './IsShowLyric'
import LyricType from './LyricType'
import IsAutoPauseLyric from './IsAutoPauseLyric'
import IsLockLyric from './IsLockLyric'
import IsShowToggleAnima from './IsShowToggleAnima'
import IsSingleLine from './IsSingleLine'
import TextSize from './TextSize'
import ViewWidth from './ViewWidth'
import MaxLineNum from './MaxLineNum'
import TextOpacity from './TextOpacity'
import TextPositionX from './TextPositionX'
import TextPositionY from './TextPositionY'
import { useI18n } from '@/lang'
import Theme from './Theme'
// import { useTranslation } from '@/plugins/i18n'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_lyric_desktop')}>
      <IsShowLyric />
      <IsAutoPauseLyric />
      <IsLockLyric />
      <IsShowToggleAnima />
      <IsSingleLine />
      <LyricType />
      <Theme />
      <TextSize />
      <ViewWidth />
      <MaxLineNum />
      <TextOpacity />
      <TextPositionX />
      <TextPositionY />
    </Section>
  )
})
