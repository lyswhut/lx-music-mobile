import { memo } from 'react'

import { View } from 'react-native'

import DownloadQuality from './DownloadQuality'
import DownloadPath from './DownloadPath'
import DownloadLyricType from './DownloadLyricType'
import { createStyle } from '@/utils/tools'

export default memo(() => {
  return (
    <View style={styles.container}>
      <DownloadQuality />
      <DownloadPath />
      <DownloadLyricType />
    </View>
  )
})

const styles = createStyle({
  container: {
    marginTop: 5,
  },
})
