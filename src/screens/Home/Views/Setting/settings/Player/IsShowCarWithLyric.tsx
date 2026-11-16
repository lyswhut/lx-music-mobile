import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'

import CheckBoxItem from '../../components/CheckBoxItem'
import { showRemoteLyric } from '@/core/desktopLyric'
import { updateNowPlayingTitles } from '@/plugins/player/utils'
import { setLastLyric } from '@/core/player/playInfo'
import settingState from '@/store/setting/state'
import playerState from '@/store/player/state'

export default memo(() => {
  const t = useI18n()
  const isShowCarWithLyric = useSettingValue('player.isShowCarWithLyric')
  const setShowCarWithLyric = async(isShowCarWithLyric: boolean) => {
    updateSetting({ 'player.isShowCarWithLyric': isShowCarWithLyric })
    if (isShowCarWithLyric) {
      showRemoteLyric(true).catch(() => {
        // 逐句事件源起不来时根本不会有 lyricLine 送下来，不能让开关亮着骗人
        updateSetting({ 'player.isShowCarWithLyric': false })
      })
    } else if (!settingState.setting['player.isShowBluetoothLyric']) {
      void showRemoteLyric(false)
      setLastLyric()
      void updateNowPlayingTitles({
        title: playerState.musicInfo.name,
        artist: playerState.musicInfo.singer ?? '',
        album: playerState.musicInfo.album ?? '',
      })
    }
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isShowCarWithLyric} onChange={setShowCarWithLyric} label={t('setting_play_show_carwith_lyric')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
