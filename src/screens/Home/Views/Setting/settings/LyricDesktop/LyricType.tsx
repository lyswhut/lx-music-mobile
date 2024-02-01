import { memo, useCallback, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'


import { showDesktopLyric } from '@/core/desktopLyric'

import settingState from '@/store/setting/state'

const LIST = [
  {
    id: true,
    name: 'setting_lyric_desktop_show_lyric_type_desktop_lyric',
  },
  {
    id: false,
    name: 'setting_lyric_desktop_show_lyric_type_statusbar_lyric',
  },
] as const

const useActive = (id: LX.AppSetting['desktopLyric.isUseDesktopLyric']) => {
  const isUseDesktopLyric = useSettingValue('desktopLyric.isUseDesktopLyric')
  const isActive = useMemo(() => isUseDesktopLyric == id, [isUseDesktopLyric, id])
  return isActive
}

const Item = ({ id, label, updaue }: {
  id: LX.AppSetting['desktopLyric.isUseDesktopLyric']
  label: string
  updaue: (id: LX.AppSetting['desktopLyric.isUseDesktopLyric']) => void
}) => {
  const isActive = useActive(id)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return <CheckBox marginRight={8} check={isActive} label={label} onChange={() => { updaue(id) }} need />
}

export default memo(() => {
  const t = useI18n()

  const list = useMemo(() => {
    return LIST.map((item) => ({ id: item.id, name: t(item.name) }))
  }, [t])

  const updaue = useCallback((isUseDesktopLyric: boolean) => {
    console.log(isUseDesktopLyric)
    updateSetting({ 'desktopLyric.isUseDesktopLyric': isUseDesktopLyric })
    if (settingState.setting['desktopLyric.enable']) {
      void showDesktopLyric()
    }
  }, [])

  return (
    <SubTitle title={t('setting_lyric_desktop_show_lyric_type')}>
      <View style={styles.list}>
        {
          list.map(({ id, name }) => <Item key={String(id)} id={id} label={name} updaue={updaue} />)
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexGrow: 0,
    flexShrink: 1,
  },
})
