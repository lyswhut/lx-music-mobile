import { memo, useMemo } from 'react'
import { toast } from '@/utils/tools'
import { useI18n } from '@/lang'
import { usePlayMusicInfo } from '@/store/player/hook'
import { downloadManager } from '@/core/download'
import Btn from './Btn'

export default memo(() => {
  const playMusicInfo = usePlayMusicInfo()
  const t = useI18n()

  const musicInfo = useMemo(() => {
    const info = playMusicInfo.musicInfo
    if (!info) return null
    if ('progress' in info) return info.metadata.musicInfo
    return info
  }, [playMusicInfo.musicInfo])

  const isOnline = useMemo(() => {
    return musicInfo != null && musicInfo.source !== 'local'
  }, [musicInfo])

  const handlePress = () => {
    if (!musicInfo) return

    if (musicInfo.source === 'local') {
      toast(t('play_detail_download_local'))
      return
    }

    if (downloadManager.isMusicInList(musicInfo)) {
      toast(t('download_exists_tip'))
      return
    }

    void downloadManager.addTask(musicInfo)
  }

  if (!isOnline) return null

  return <Btn icon="download-2" onPress={handlePress} />
})
