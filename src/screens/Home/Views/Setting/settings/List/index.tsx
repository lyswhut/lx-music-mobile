import { memo } from 'react'
import { View } from 'react-native'

import Section from '../../components/Section'
import SubTitle from '../../components/SubTitle'
import AddMusicLocationType from './AddMusicLocationType'
import IsClickPlayList from './IsClickPlayList'
import IsShowAlbumName from './IsShowAlbumName'
import IsShowInterval from './IsShowInterval'

import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_list')}>
      <SubTitle title={t('setting_list')}>
        <IsClickPlayList />
        <View style={styles.row}>
          <View style={styles.item}>
            <IsShowAlbumName />
          </View>
          <View style={styles.item}>
            <IsShowInterval />
          </View>
        </View>
      </SubTitle>
      <AddMusicLocationType />
    </Section>
  )
})

const styles = createStyle({
  row: {
    flexDirection: 'row',
  },
  item: {
    flex: 1,
  },
})