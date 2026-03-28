import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const allowProgressBarSeek = useSettingValue('common.allowProgressBarSeek')
  const setAllowProgressBarSeek = (allowProgressBarSeek: boolean) => {
    updateSetting({ 'common.allowProgressBarSeek': allowProgressBarSeek })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={allowProgressBarSeek} label={t('setting_basic_allow_progress_bar_seek')} onChange={setAllowProgressBarSeek} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
