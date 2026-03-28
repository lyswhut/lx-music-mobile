import { memo } from 'react'
import { View } from 'react-native'

import CheckBoxItem from '../../components/CheckBoxItem'
import { createStyle } from '@/utils/tools'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'

export default memo(() => {
  const t = useI18n()
  const isFontShadow = useSettingValue('theme.fontShadow')
  const setIsFontShadow = (isFontShadow: boolean) => {
    updateSetting({ 'theme.fontShadow': isFontShadow })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isFontShadow} label={t('setting_basic_theme_font_shadow')} onChange={setIsFontShadow} />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
    marginBottom: 15,
  },
})
