import { useCallback } from 'react'
import { View } from 'react-native'
import { useLocalMusics, useIsScanning } from '@/store/localMusic/hook'
import { action } from '@/store/localMusic'
import { scanLocalMusics } from '@/core/localMusic'
import { overwriteListMusics } from '@/core/list'
import { LIST_IDS } from '@/config/constant'
import { toast } from '@/utils/tools'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import ActionBar from './ActionBar'
import MusicList from './MusicList'
import Empty from './Empty'

export default () => {
  const t = useI18n()
  const musics = useLocalMusics()
  const isScanning = useIsScanning()

  const handleScan = useCallback(async (dirPath: string) => {
    action.setScanning(true)
    try {
      const { musics: result, truncated } = await scanLocalMusics(dirPath)
      if (result.length === 0) {
        toast(t('local_music_scan_no_files'))
        action.setScanning(false)
        return
      }
      if (truncated) {
        toast(t('local_music_scan_truncated', { count: result.length }))
      }
      action.setLocalMusics(result)
      await overwriteListMusics(LIST_IDS.TEMP, result)
    } catch (err) {
      console.error('[LocalMusic] scan failed:', err)
      toast(t('local_music_scan_failed'))
    } finally {
      action.setScanning(false)
    }
  }, [t])

  return (
    <View style={styles.container}>
      <ActionBar onScan={handleScan} isScanning={isScanning} />
      {musics.length > 0 ? (
        <MusicList musics={musics} />
      ) : (
        <Empty />
      )}
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
})
