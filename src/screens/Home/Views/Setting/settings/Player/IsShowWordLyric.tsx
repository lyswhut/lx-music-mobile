import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'
import { toggleWordLyric } from '@/core/lyric'

export default memo(() => {
  const t = useI18n()
  const isShowWordLyric = useSettingValue('player.isShowWordLyric')
  const setShowWordLyric = (isShowWordLyric: boolean) => {
    updateSetting({ 'player.isShowWordLyric': isShowWordLyric })
    void toggleWordLyric(isShowWordLyric)
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isShowWordLyric} onChange={setShowWordLyric} label={t('setting_play_show_word_lyric')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
