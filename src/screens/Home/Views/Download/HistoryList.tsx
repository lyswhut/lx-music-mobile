import { memo } from 'react'
import { View, FlatList } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle, confirmDialog } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useDownloadHistory } from '@/store/download/hook'
import { downloadManager } from '@/core/download'
import HistoryListItem from './HistoryListItem'

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const history = useDownloadHistory()

  const handleClearHistory = async() => {
    const confirm = await confirmDialog({
      message: t('download_clear_history_confirm'),
      bgClose: false,
    })
    if (confirm) {
      await downloadManager.clearHistory()
    }
  }

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text color={theme['c-font-label']} size={14}>{t('download_empty_history')}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HistoryListItem item={item} />}
        contentContainerStyle={styles.listContent}
      />
      <View style={{ ...styles.footer, borderTopColor: theme['c-border-background'] }}>
        <Text style={styles.clearBtn} onPress={handleClearHistory} color={theme['c-error']}>{t('download_clear_history')}</Text>
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 15,
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  clearBtn: {
    padding: 10,
  },
})
