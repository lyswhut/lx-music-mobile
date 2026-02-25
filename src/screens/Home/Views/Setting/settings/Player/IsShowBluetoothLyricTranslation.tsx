import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isShowBluetoothLyricTranslation = useSettingValue('player.isShowBluetoothLyricTranslation')
  const setShowBluetoothLyricTranslation = (isShowBluetoothLyricTranslation: boolean) => {
    updateSetting({ 'player.isShowBluetoothLyricTranslation': isShowBluetoothLyricTranslation })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isShowBluetoothLyricTranslation} onChange={setShowBluetoothLyricTranslation} label={t('setting_play_show_bluetooth_lyric_translation')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
