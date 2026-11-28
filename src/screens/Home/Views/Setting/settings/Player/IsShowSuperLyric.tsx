import { memo } from 'react'
import { Platform, View } from 'react-native'

import { updateSetting } from '@/core/common'
import { checkSuperLyricAvailable, setSuperLyricEnabled } from '@/core/superLyric'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle, toast } from '@/utils/tools'

import CheckBoxItem from '../../components/CheckBoxItem'

export default memo(() => {
  const t = useI18n()
  const isShowSuperLyric = useSettingValue('player.isShowSuperLyric')

  // SuperLyric 服务仅在 Android 8.0+ 注册
  if (!(Platform.OS === 'android' && Number(Platform.Version) >= 26)) return null

  const setShowSuperLyric = async(isShow: boolean) => {
    if (isShow && !(await checkSuperLyricAvailable())) {
      toast(t('setting_play_show_super_lyric_unavailable'), 'long')
    }
    updateSetting({ 'player.isShowSuperLyric': isShow })
    void setSuperLyricEnabled(isShow)
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isShowSuperLyric} onChange={setShowSuperLyric} label={t('setting_play_show_super_lyric')} />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
