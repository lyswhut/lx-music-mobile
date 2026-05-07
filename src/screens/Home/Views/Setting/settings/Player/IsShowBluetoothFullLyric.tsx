import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle, remoteLyricTip } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'
import { updateNowPlayingTitles } from '@/plugins/player/utils'
import playerState from '@/store/player/state'

export default memo(() => {
  const t = useI18n()
  const isShowBluetoothFullLyric = useSettingValue('player.isShowBluetoothFullLyric')
  const setShowBluetoothFullLyric = async(isShowBluetoothFullLyric: boolean) => {
    if (isShowBluetoothFullLyric) await remoteLyricTip()
    updateSetting({ 'player.isShowBluetoothFullLyric': isShowBluetoothFullLyric })
    if (isShowBluetoothFullLyric && playerState.musicInfo.lrc) {
      void updateNowPlayingTitles({
        lyric: playerState.musicInfo.lrc,
      })
    }
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isShowBluetoothFullLyric} onChange={setShowBluetoothFullLyric} label={t('setting_play_show_bluetooth_full_lyric')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})

