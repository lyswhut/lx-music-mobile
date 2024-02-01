import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'


import CheckBoxItem from '../../components/CheckBoxItem'
import { toggleDesktopAutoPause } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const isAutoPause = useSettingValue('desktopLyric.isAutoPause')
  const setLock = (isAutoPause: boolean) => {
    void toggleDesktopAutoPause(isAutoPause).then(() => {
      updateSetting({ 'desktopLyric.isAutoPause': isAutoPause })
    })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isAutoPause} onChange={setLock} label={t('setting_lyric_desktop_auto_pause')} />
    </View>
  )
})


const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
