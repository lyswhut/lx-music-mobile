import { memo } from 'react'
import { View } from 'react-native'

import CheckBoxItem from '../../components/CheckBoxItem'
import { createStyle } from '@/utils/tools'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'

export default memo(() => {
  const t = useI18n()
  const isDynamicBg = useSettingValue('theme.dynamicBg')
  const setIsDynamicBg = (isDynamicBg: boolean) => {
    updateSetting({ 'theme.dynamicBg': isDynamicBg })
  }


  return (
    <View style={styles.content}>
      <CheckBoxItem check={isDynamicBg} label={t('setting_basic_theme_dynamic_bg')} onChange={setIsDynamicBg} />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
    // marginBottom: 15,
  },
})
