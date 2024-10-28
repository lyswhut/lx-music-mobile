import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'


import CheckBoxItem from '../../components/CheckBoxItem'
import { toggleRoma } from '@/core/lyric'

export default memo(() => {
  const t = useI18n()
  const isSendBluetoothLyric = useSettingValue('player.isSendBluetoothLyric')
  const setSendBluetoothLyric = (isSendBluetoothLyric: boolean) => {
    updateSetting({ 'player.isSendBluetoothLyric': isSendBluetoothLyric })
    void toggleRoma(isSendBluetoothLyric)
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isSendBluetoothLyric} onChange={setSendBluetoothLyric} label={t('setting_play_send_bluetooth_lyric')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
