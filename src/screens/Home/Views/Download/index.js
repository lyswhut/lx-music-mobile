import { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle, toast } from '@/utils/tools'
import { readMusicDownloadDirectory } from '@/utils/fs'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { useNavActiveId } from '@/store/common/hook'
import { BorderWidths } from '@/theme'
import { sizeFormate } from '@/utils'

const DownloadRow = ({ item }) => {
  const theme = useTheme()
  const sizeText = useMemo(() => sizeFormate(item.size || 0), [item.size])
  return (
    <View style={[
      styles.row,
      {
        borderColor: theme['c-border-background'],
        backgroundColor: theme['c-primary-light-800-alpha-500'],
      },
    ]}>
      <Icon name="music" size={16} color={theme['c-primary-font-active']} />
      <View style={styles.rowCenter}>
        <Text numberOfLines={1}>{item.name}</Text>
        <Text size={11} color={theme['c-font-label']}>{sizeText}</Text>
      </View>
    </View>
  )
}

export default () => {
  const t = (key, options) => global.i18n.t(key, options)
  const theme = useTheme()
  const navActiveId = useNavActiveId()
  const [isLoading, setLoading] = useState(false)
  const [list, setList] = useState([])

  /**
   * 刷新下载目录列表，只展示文件条目。
   */
  const refresh = useCallback(async() => {
    setLoading(true)
    try {
      const files = await readMusicDownloadDirectory()
      setList(files.filter(item => item.isFile))
    } catch {
      setList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (navActiveId == 'nav_download') {
      refresh().catch(() => {})
    }
  }, [navActiveId, refresh])

  /**
   * 手动刷新下载页内容。
   */
  const handleRefreshPress = () => {
    refresh()
      .then(() => {
        toast(t('download_refreshed'))
      })
      .catch(() => {})
  }

  return (
    <View style={styles.container}>
      <View style={[
        styles.header,
        { borderBottomColor: theme['c-border-background'] },
      ]}>
        <Text style={styles.title} size={17}>{t('nav_download')}</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefreshPress} activeOpacity={0.75}>
          <Text size={12}>{t('download_refresh')}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {
          isLoading
            ? <Text style={styles.tip} color={theme['c-font-label']}>{t('download_loading')}</Text>
            : list.length
              ? list.map(item => <DownloadRow key={item.path} item={item} />)
              : <Text style={styles.tip} color={theme['c-font-label']}>{t('download_empty')}</Text>
        }
      </ScrollView>
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: BorderWidths.normal,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 14,
  },
  title: {
    fontWeight: '700',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  list: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  row: {
    borderWidth: BorderWidths.normal,
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowCenter: {
    flex: 1,
    paddingLeft: 8,
  },
  tip: {
    textAlign: 'center',
    paddingVertical: 24,
  },
})
