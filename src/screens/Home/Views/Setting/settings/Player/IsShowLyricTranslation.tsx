import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'
import { toggleTranslation } from '@/core/lyric'

export default memo(() => {
  const t = useI18n()
  const isShowLyricTranslation = useSettingValue('player.isShowLyricTranslation')
  const setShowLyricTranslation = (isShowLyricTranslation: boolean) => {
    updateSetting({ 'player.isShowLyricTranslation': isShowLyricTranslation })
    void toggleTranslation(isShowLyricTranslation)
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isShowLyricTranslation} onChange={setShowLyricTranslation} label={t('setting_play_show_translation')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
