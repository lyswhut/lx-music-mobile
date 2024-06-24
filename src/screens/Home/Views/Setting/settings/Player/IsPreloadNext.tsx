import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isPreloadNext = useSettingValue('player.isPreloadNext')
  const setPreloadNext = (isPreloadNext: boolean) => {
    updateSetting({ 'player.isPreloadNext': isPreloadNext })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isPreloadNext} onChange={setPreloadNext} label={t('setting_play_preload_next')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})

