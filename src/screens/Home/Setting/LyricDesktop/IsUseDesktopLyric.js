import React, { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'
import { useGetter, useDispatch } from '@/store'

import SubTitle from '../components/SubTitle'
import { useTranslation } from '@/plugins/i18n'
import CheckBox from '@/components/common/CheckBox'


const useActive = id => {
  const isUseDesktopLyric = useGetter('common', 'isUseDesktopLyric')
  const isActive = useMemo(() => isUseDesktopLyric == id, [isUseDesktopLyric, id])
  return isActive
}

const Item = ({ id, name, change }) => {
  const isActive = useActive(id)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => change(id)} need />
}

export default memo(() => {
  const { t } = useTranslation()
  const setIsUseDesktopLyric = useDispatch('common', 'setIsUseDesktopLyric')
  const list = useMemo(() => [
    {
      id: true,
      name: t('setting_lyric_desktop_show_lyric_type_desktop_lyric'),
    },
    {
      id: false,
      name: t('setting_lyric_desktop_show_lyric_type_statusbar_lyric'),
    },
  ], [t])

  return (
    <SubTitle title={t('setting_lyric_desktop_show_lyric_type')}>
      <View style={styles.list}>
        {
          list.map(({ id, name }) => <Item name={name} id={id} key={id} change={setIsUseDesktopLyric} />)
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})

