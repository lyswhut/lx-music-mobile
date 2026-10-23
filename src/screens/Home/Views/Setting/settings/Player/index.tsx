import { memo } from 'react'

import Section from '../../components/Section'
import IsSavePlayTime from './IsSavePlayTime'
import PlayHighQuality from './PlayHighQuality'
import IsHandleAudioFocus from './IsHandleAudioFocus'
import IsEnableAudioOffload from './IsEnableAudioOffload'
import IsAutoCleanPlayedList from './IsAutoCleanPlayedList'
import IsShowBluetoothLyric from './IsShowBluetoothLyric'
import IsShowBluetoothFullLyric from './IsShowBluetoothFullLyric'
import IsShowNotificationImage from './IsShowNotificationImage'
import IsShowLyricTranslation from './IsShowLyricTranslation'
import IsShowLyricRoma from './IsShowLyricRoma'
import IsShowWordLyric from './IsShowWordLyric'
import WordLyricColor from './WordLyricColor'
import WordLyricBrightness from './WordLyricBrightness'
import WordLyricContrast from './WordLyricContrast'
import IsS2T from './IsS2T'
import MaxCache from './MaxCache'
import { useI18n } from '@/lang'


export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_player')}>
      <IsSavePlayTime />
      <IsAutoCleanPlayedList />
      <IsHandleAudioFocus />
      <IsEnableAudioOffload />
      <IsShowBluetoothLyric />
      <IsShowBluetoothFullLyric />
      <IsShowNotificationImage />
      <IsShowLyricTranslation />
      <IsShowLyricRoma />
      <IsShowWordLyric />
      <WordLyricColor />
      <WordLyricBrightness />
      <WordLyricContrast />
      <IsS2T />
      <MaxCache />
      <PlayHighQuality />
    </Section>
  )
})
