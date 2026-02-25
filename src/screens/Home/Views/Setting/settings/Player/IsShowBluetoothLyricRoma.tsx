import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isShowBluetoothLyricRoma = useSettingValue('player.isShowBluetoothLyricRoma')
  const setShowBluetoothLyricRoma = (isShowBluetoothLyricRoma: boolean) => {
    updateSetting({ 'player.isShowBluetoothLyricRoma': isShowBluetoothLyricRoma })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isShowBluetoothLyricRoma} onChange={setShowBluetoothLyricRoma} label={t('setting_play_show_bluetooth_lyric_roma')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
