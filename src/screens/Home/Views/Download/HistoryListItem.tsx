import { memo } from 'react'
import { View } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle, confirmDialog } from '@/utils/tools'
import Text from '@/components/common/Text'
import { downloadManager } from '@/core/download'

export default memo(({ item }: {
  item: LX.Download.DownloadHistoryItem
}) => {
  const t = useI18n()
  const theme = useTheme()

  const handleDelete = async() => {
    const confirm = await confirmDialog({
      message: t('download_delete_confirm'),
      bgClose: false,
    })
    if (confirm) {
      await downloadManager.deleteTask(item.id)
    }
  }

  const handleRetry = async() => {
    await downloadManager.retryTask(item.id)
  }

  const isFailed = item.status === 'failed'
  const formattedTime = item.completedTime ? new Date(item.completedTime).toLocaleDateString() : '-'
  const fileSize = item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(1)} MB` : '-'

  return (
    <View style={{ ...styles.container, borderBottomColor: theme['c-border-background'] }}>
      <View style={styles.info}>
        <Text numberOfLines={1} size={14} color={theme['c-font']}>{item.musicInfo.name}</Text>
        <Text numberOfLines={1} size={12} color={theme['c-font-label']}>{item.musicInfo.singer}</Text>
        <View style={styles.statusRow}>
          <Text size={12} color={isFailed ? theme['c-error-font'] : theme['c-success-font']}>
            {isFailed ? t('download_status_failed') : t('download_status_completed')}
          </Text>
          <Text size={12} color={theme['c-font-label']}>{fileSize}</Text>
          <Text size={12} color={theme['c-font-label']}>{formattedTime}</Text>
        </View>
        {
          isFailed && item.errorMessage
            ? <Text size={12} color={theme['c-error-font']} style={styles.errorTip}>{item.errorMessage}</Text>
            : null
        }
      </View>
      <View style={styles.action}>
        {
          isFailed
            ? <Text style={styles.actionBtn} onPress={handleRetry} color={theme['c-primary-font']}>{t('download_retry')}</Text>
            : null
        }
        <Text style={styles.actionBtn} onPress={handleDelete} color={theme['c-error-font']}>{t('download_delete')}</Text>
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  errorTip: {
    marginTop: 4,
  },
  action: {
    flexShrink: 0,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
  },
})
