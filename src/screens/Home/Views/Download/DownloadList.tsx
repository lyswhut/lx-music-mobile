import { memo } from 'react'
import { View, FlatList, StyleSheet } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useDownloadTasks } from '@/store/download/hook'
import DownloadListItem from './DownloadListItem'

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const tasks = useDownloadTasks()

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text color={theme['c-font-label']} size={14}>{t('download_empty_tasks')}</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <DownloadListItem item={item} />}
      contentContainerStyle={styles.listContent}
    />
  )
})

const styles = createStyle({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 15,
  },
})
