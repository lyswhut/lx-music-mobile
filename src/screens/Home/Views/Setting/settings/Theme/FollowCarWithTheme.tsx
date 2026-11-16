import { memo } from 'react'
import { View } from 'react-native'

import CheckBoxItem from '../../components/CheckBoxItem'
import { createStyle } from '@/utils/tools'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { refreshSunTheme } from '@/core/init/sunTheme'

export default memo(() => {
  const t = useI18n()
  const isOn = useSettingValue('common.followCarWithTheme')

  const setIsOn = (isOn: boolean) => {
    // 三个开关（跟随系统亮暗、跟随CarWith亮暗、连接时跟随日出日落）是「或」的关系：
    // 任意一个报出「该深色」就变深色，都没报深色就是主题列表里选的那个。
    // 这一行只在连着 CarWith 时参与判定，读的是车机自己写进系统的深浅色
    updateSetting({ 'common.followCarWithTheme': isOn })
    void refreshSunTheme()
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isOn} label={t('setting_basic_theme_follow_carwith')} onChange={setIsOn} />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
