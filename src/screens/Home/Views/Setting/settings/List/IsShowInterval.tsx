import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isShowInterval = useSettingValue('list.isShowInterval')
  const setShowInterval = (isShowInterval: boolean) => {
    requestAnimationFrame(() => {
      updateSetting({ 'list.isShowInterval': isShowInterval })
    })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isShowInterval} onChange={setShowInterval} label={t('setting_list_show interval')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
    marginBottom: 15,
  },
})

