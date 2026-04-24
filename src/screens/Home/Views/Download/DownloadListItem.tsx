import { memo } from 'react'
import { View, StyleSheet } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle, confirmDialog } from '@/utils/tools'
import Text from '@/components/common/Text'
import { downloadManager } from '@/core/download'

const STATUS_TEXT_MAP = {
  run: 'download_status_downloading',
  waiting: 'download_status_waiting',
  pause: 'download_status_paused',
  error: 'download_status_failed',
  completed: 'download_status_completed',
} as const

export default memo(({ item }: {
  item: LX.Download.ListItem
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

  const isCompleted = item.status === 'completed'
  const isError = item.status === 'error'

  return (
    <View style={{ ...styles.container, borderBottomColor: theme['c-border-background'] }}>
      <View style={styles.info}>
        <Text numberOfLines={1} size={14} color={theme['c-font']}>{item.metadata.musicInfo.name}</Text>
        <Text numberOfLines={1} size={12} color={theme['c-font-label']}>{item.metadata.musicInfo.singer}</Text>
        <View style={styles.statusRow}>
          <Text size={12} color={isError ? theme['c-error'] : theme['c-font-label']}>
            {t(STATUS_TEXT_MAP[item.status])}
            {isError && item.statusText ? `: ${item.statusText}` : ''}
          </Text>
          {
            item.status === 'run'
              ? <Text size={12} color={theme['c-font-label']}>{item.speed}</Text>
              : null
          }
          {
            isCompleted
              ? <Text size={12} color={theme['c-font-label']}>{(item.total / 1024 / 1024).toFixed(1)} MB</Text>
              : null
          }
        </View>
        {
          item.status === 'run'
            ? <View style={styles.progressBar}>
                <View style={{ ...styles.progressFill, width: `${item.progress * 100}%`, backgroundColor: theme['c-primary'] }} />
              </View>
            : null
        }
      </View>
      <View style={styles.action}>
        <Text style={styles.deleteBtn} onPress={handleDelete} color={theme['c-error']}>{t('download_delete')}</Text>
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
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  action: {
    flexShrink: 0,
  },
  deleteBtn: {
    padding: 8,
  },
})
