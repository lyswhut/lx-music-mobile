import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import CheckBoxItem from '../../components/CheckBoxItem'
import { setLyricSendState } from '@/core/lyric'


export default memo(() => {
  const t = useI18n()
  const isShowCarLyric = useSettingValue('player.isShowCarLyric')
  const setShowCarLyric = async(isShowCarLyric: boolean) => {
    updateSetting({ 'player.isShowCarLyric': isShowCarLyric })
    // 让原生按「显示蓝牙歌词 OR 车载歌词」决定是否持续发送歌词文本，否则 UCAR_TITLE 不滚动
    setLyricSendState()
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isShowCarLyric} onChange={setShowCarLyric} label={t('setting_play_show_car_lyric')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
