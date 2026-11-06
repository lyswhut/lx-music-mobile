import { memo } from 'react'

import { StyleSheet, View } from 'react-native'
import Section from '../../components/Section'
import SubTitle from '../../components/SubTitle'
import IsShowHotSearch from './IsShowHotSearch'
import IsShowHistorySearch from './IsShowHistorySearch'

import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_search')}>
      <SubTitle title={t('setting_search')}>
        <View style={styles.row}>
          <View style={styles.column}>
            <IsShowHotSearch />
          </View>
          <View style={styles.column}>
            <IsShowHistorySearch />
          </View>
        </View>
      </SubTitle>
    </Section>
  )
})

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
  },
})