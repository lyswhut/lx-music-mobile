import { useEffect, useState } from 'react'
import { Modal, View } from 'react-native'
import Text from '@/components/common/Text'
import Button from '@/components/common/Button'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { cancelMusicDownload, closeDownload, getDownloadQualities, getDownloadState, isDownloadSupported, startMusicDownload, subscribeDownload } from '@/core/download'

export default () => {
  const t = useI18n()
  const theme = useTheme()
  const [state, setState] = useState(getDownloadState)
  const [quality, setQuality] = useState<LX.Quality>('128k')
  useEffect(() => subscribeDownload(() => { setState(getDownloadState()) }), [])
  useEffect(() => { setQuality(state.quality) }, [state.musicInfo, state.quality])
  if (!isDownloadSupported || !state.musicInfo) return null
  const busy = ['preparing', 'resolving', 'downloading', 'cancelling'].includes(state.status)
  const qualities = getDownloadQualities(state.musicInfo)
  const size = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`
  const percent = state.total > 0 ? Math.min(100, Math.floor(state.received / state.total * 100)) : null
  const messages = {
    ready: t('music_download_ready'), preparing: t('music_download_authorize'),
    resolving: t('music_download_resolving'), downloading: t('music_download_downloading'),
    cancelling: t('music_download_cancelling'), completed: t('music_download_completed'),
    cancelled: t('music_download_cancelled'), failed: t('music_download_failed'),
  }
  return (
    <Modal visible={state.visible} transparent animationType="fade" onRequestClose={busy ? cancelMusicDownload : closeDownload}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 }}>
        <View style={{ width: '100%', maxWidth: 440, padding: 20, borderRadius: 8, backgroundColor: theme['c-content-background'] }}>
          <Text size={20}>{t('music_download')}</Text>
          <Text style={{ marginTop: 14 }}>{state.musicInfo.name} - {state.musicInfo.singer}</Text>
          <Text size={13} style={{ marginTop: 12 }}>{t('music_download_directory')}</Text>
          {!busy && state.status !== 'completed' && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
              {qualities.map(item => (
                <Button key={item} onPress={() => { setQuality(item) }} style={{ padding: 10, margin: 3, borderWidth: 1, borderColor: item === quality ? theme['c-primary-font'] : theme['c-border-background'] }}>
                  <Text color={item === quality ? theme['c-primary-font'] : theme['c-font']}>{item}</Text>
                </Button>
              ))}
            </View>
          )}
          <Text style={{ marginTop: 16 }}>{messages[state.status]}</Text>
          {state.status === 'downloading' && (
            <>
              <Text style={{ marginTop: 8 }}>{size(state.received)}{state.total > 0 ? ` / ${size(state.total)} (${percent}%)` : ''}</Text>
              <View style={{ height: 5, marginTop: 8, backgroundColor: theme['c-border-background'] }}>
                <View style={{ height: 5, width: `${percent ?? 0}%`, backgroundColor: theme['c-primary-font'] }} />
              </View>
            </>
          )}
          {state.status === 'failed' && <Text size={13} style={{ marginTop: 10 }}>{state.error}</Text>}
          {state.status === 'completed' && <Text size={13} style={{ marginTop: 10 }}>{state.path.split('/').at(-1)}</Text>}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 }}>
            {busy
              ? <Button disabled={state.status === 'cancelling'} onPress={cancelMusicDownload} style={{ padding: 12 }}><Text>{t('dialog_cancel')}</Text></Button>
              : <>
                  <Button onPress={closeDownload} style={{ padding: 12 }}><Text>{t('music_download_close')}</Text></Button>
                  {state.status !== 'completed' && <Button disabled={!qualities.includes(quality)} onPress={() => { void startMusicDownload(quality) }} style={{ padding: 12 }}><Text color={theme['c-primary-font']}>{t('music_download')}</Text></Button>}
                </>}
          </View>
        </View>
      </View>
    </Modal>
  )
}
