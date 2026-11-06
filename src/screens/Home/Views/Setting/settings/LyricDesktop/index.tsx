import { memo } from 'react'

import { StyleSheet, View } from 'react-native'
import Section from '../../components/Section'
import SubTitle from '../../components/SubTitle'
import IsShowLyric from './IsShowLyric'
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
      <SubTitle title={t('setting_lyric_desktop')}>
        <View style={styles.optionsContainer}>
          <View style={styles.row}>
            <View style={styles.column}>
              <IsShowLyric />
            </View>
            <View style={styles.column}>
              <IsLockLyric />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <IsShowToggleAnima />
            </View>
            <View style={styles.column}>
              <IsSingleLine />
            </View>
          </View>
        </View>
      </SubTitle>
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

const styles = StyleSheet.create({
  optionsContainer: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
  },
})