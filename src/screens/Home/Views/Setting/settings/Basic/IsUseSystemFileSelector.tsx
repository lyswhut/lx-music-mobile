import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const val = useSettingValue('common.useSystemFileSelector')
  const update = (useSystemFileSelector: boolean) => {
    updateSetting({ 'common.useSystemFileSelector': useSystemFileSelector })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem
      check={val}
      label={t('setting_basic_use_system_file_selector')}
      helpDesc={t('setting_basic_use_system_file_selector_tip')}
      onChange={update} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
    // marginBottom: 15,
  },
})
