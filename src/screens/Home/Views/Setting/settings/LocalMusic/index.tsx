import { memo, useCallback, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'

import Section from '../../components/Section'
import Button from '../../components/Button'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { selectManagedFolder } from '@/utils/fs'
import { useSettingValue } from '@/store/setting/hook'
import { setFolderPath, startScan, type ScanProgress } from '@/core/localMusic'

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const folderPath = useSettingValue('localMusic.folderPath')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState<ScanProgress | null>(null)

  const handleSelectFolder = useCallback(async() => {
    try {
      const result = await selectManagedFolder(true)
      if (result?.path) {
        setFolderPath(result.path)
      }
    } catch {
      // 用户取消选择
    }
  }, [])

  const handleScan = useCallback(async() => {
    setScanning(true)
    setProgress(null)
    try {
      await startScan((p) => {
        setProgress({ ...p })
      })
    } finally {
      setScanning(false)
      setProgress(null)
    }
  }, [])

  const displayPath = folderPath || t('setting_localMusic_no_folder')

  return (
    <Section title={t('setting_localMusic')}>
      {/* 文件夹路径 */}
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text size={14} color={theme['c-font']}>{t('setting_localMusic_folder_label')}</Text>
        </View>
        <View style={styles.valueContainer}>
          <Text style={styles.folderPath} numberOfLines={1} size={12} color={theme['c-font-label']}>{displayPath}</Text>
          <Button disabled={scanning} onPress={handleSelectFolder}>
            {t('setting_localMusic_select_folder')}
          </Button>
        </View>
      </View>

      {/* 扫描按钮 */}
      <View style={styles.scanSection}>
        <TouchableOpacity
          style={{ ...styles.scanButton, backgroundColor: scanning ? theme['c-border-background'] : theme['c-primary'] }}
          onPress={handleScan}
          disabled={scanning || !folderPath}
          activeOpacity={0.7}
        >
          <Text size={16} color={scanning || !folderPath ? theme['c-font-label'] : '#fff'}>
            {scanning && progress ? ` ${progress.current}/${progress.total}` : t('setting_localMusic_scan')}
          </Text>
        </TouchableOpacity>

        {/* 进度条 */}
        {scanning && progress ? (
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text size={12} color={theme['c-font-label']}>{t('setting_localMusic_scanning')}</Text>
              <Text size={12} color={theme['c-font-label']}>{progress.current}/{progress.total}</Text>
            </View>
            <View style={{ ...styles.progressBar, backgroundColor: theme['c-border-background'] }}>
              <View style={{ ...styles.progressFill, width: `${(progress.current / progress.total) * 100}%`, backgroundColor: theme['c-primary'] }} />
            </View>
            <Text style={styles.currentFile} numberOfLines={1} size={11} color={theme['c-font-label']}>{t('setting_localMusic_reading')}: {progress.currentFile}</Text>
          </View>
        ) : null}

        <Text style={styles.tip} size={11} color={theme['c-font-label']}>{t('setting_localMusic_scan_tip')}</Text>
      </View>

      {/* 覆盖警告 */}
      <View style={{ ...styles.warningBox, backgroundColor: theme['c-warning-background'] || '#fff3e0' }}>
        <Text size={12} color={theme['c-warning-color'] || '#e65100'}>{t('setting_localMusic_overwrite_tip')}</Text>
      </View>
    </Section>
  )
})

const styles = createStyle({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 5,
  },
  labelContainer: {
    flexShrink: 0,
    width: '30%',
  },
  valueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  folderPath: {
    flex: 1,
    marginRight: 8,
    textAlign: 'right',
  },
  scanSection: {
    marginTop: 10,
    marginBottom: 5,
  },
  scanButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  currentFile: {
    marginTop: 6,
  },
  tip: {
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 16,
  },
  warningBox: {
    marginTop: 15,
    padding: 10,
    borderRadius: 6,
  },
})
