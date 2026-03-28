import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const val = useSettingValue('common.alwaysKeepStatusbarHeight')
  const update = (alwaysKeepStatusbarHeight: boolean) => {
    updateSetting({ 'common.alwaysKeepStatusbarHeight': alwaysKeepStatusbarHeight })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem
        check={val}
        label={t('setting_basic_always_keep_statusbar_height')}
        helpDesc={t('setting_basic_always_keep_statusbar_height_tip')}
        onChange={update} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
    marginBottom: 15,
  },
})
