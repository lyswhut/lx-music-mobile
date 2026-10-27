import { useMemo } from 'react'

import { View } from 'react-native'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { toggleWordLyric } from '@/core/lyric'
import CheckBox from '@/components/common/CheckBox'
import Text from '@/components/common/Text'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { parseWordLyric } from '@/plugins/lyric'
import styles from './style'

export default () => {
  const t = useI18n()
  const isShowWordLyric = useSettingValue('player.isShowWordLyric')
  const musicInfo = usePlayerMusicInfo()
  // 当前歌曲没有可解析的逐字歌词数据时禁用切换
  // 注意：不能以 wordLines 是否为空判断——关闭开关时逐字数据会被清空，
  // 会被误判为“无数据”，导致关闭后无法重新开启
  const disabled = useMemo(() => {
    const lxlrc = musicInfo.lxlrc
    return !lxlrc || parseWordLyric(lxlrc).length == 0
  }, [musicInfo.lxlrc])

  const setShowWordLyric = (enable: boolean) => {
    updateSetting({ 'player.isShowWordLyric': enable })
    void toggleWordLyric(enable)
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <CheckBox
          marginBottom={3}
          check={isShowWordLyric}
          disabled={disabled}
          label={t('play_detail_setting_word_lyric')}
          onChange={setShowWordLyric}
        />
      </View>
      {
        disabled ? (
          <View style={styles.tip}>
            <Text style={styles.tipText} size={12} color="c-500">{t('play_detail_setting_word_lyric_not_support')}</Text>
          </View>
        ) : null
      }
    </View>
  )
}
