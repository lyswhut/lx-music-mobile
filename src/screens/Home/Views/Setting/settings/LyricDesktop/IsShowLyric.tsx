import { memo, useRef } from 'react'
import { View } from 'react-native'

import CheckBoxItem from '../../components/CheckBoxItem'

import { createStyle } from '@/utils/tools'

import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import DesktopLyricEnable, { type DesktopLyricEnableType } from '@/components/DesktopLyricEnable'

export default memo(() => {
  const t = useI18n()
  const isEnable = useSettingValue('desktopLyric.enable')
  // const setIsShowDesktopLyric = useDispatch('common', 'setIsShowDesktopLyric')
  const desktopLyricEnableRef = useRef<DesktopLyricEnableType>(null)

  const handleChangeEnableDesktopLyric = async(isEnable: boolean) => {
    desktopLyricEnableRef.current?.setEnabled(isEnable)
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isEnable} onChange={(enable) => { void handleChangeEnableDesktopLyric(enable) }} label={t('setting_lyric_desktop_enable')} />
      <DesktopLyricEnable ref={desktopLyricEnableRef} />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
