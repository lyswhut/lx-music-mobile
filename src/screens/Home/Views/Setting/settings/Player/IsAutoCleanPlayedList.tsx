import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isAutoCleanPlayedList = useSettingValue('player.isAutoCleanPlayedList')
  const setAutoCleanPlayedList = (isAutoCleanPlayedList: boolean) => {
    updateSetting({ 'player.isAutoCleanPlayedList': isAutoCleanPlayedList })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem
        check={isAutoCleanPlayedList}
        onChange={setAutoCleanPlayedList}
        helpDesc={t('setting_play_auto_clean_played_list_tip')}
        label={t('setting_play_auto_clean_played_list')}
      />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})

