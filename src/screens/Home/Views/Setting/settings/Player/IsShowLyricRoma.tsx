import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'
import { toggleRoma } from '@/core/lyric'

export default memo(() => {
  const t = useI18n()
  const isShowLyricRoma = useSettingValue('player.isShowLyricRoma')
  const setShowLyricRoma = (isShowLyricRoma: boolean) => {
    updateSetting({ 'player.isShowLyricRoma': isShowLyricRoma })
    void toggleRoma(isShowLyricRoma)
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isShowLyricRoma} onChange={setShowLyricRoma} label={t('setting_play_show_roma')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
