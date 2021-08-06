import React, { memo, useCallback, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'
import { useGetter, useDispatch } from '@/store'

import SubTitle from '../components/SubTitle'
import { useTranslation } from '@/plugins/i18n'
import CheckBox from '@/components/common/CheckBox'
import { textPositionY } from '@/utils/lyricDesktop'

const useActive = id => {
  const { y } = useGetter('common', 'desktopLyricTextPosition')
  const isActive = useMemo(() => y == id, [y, id])
  return isActive
}

const Item = ({ id, name, change }) => {
  const isActive = useActive(id)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => change({ y: id })} need />
}

export default memo(() => {
  const { t } = useTranslation()
  const setDesktopLyricTextPosition = useDispatch('common', 'setDesktopLyricTextPosition')
  const list = useMemo(() => {
    return textPositionY.map(({ id }) => ({ id, name: t('setting_lyric_desktop_text_y_' + id) }))
  }, [t])

  return (
    <SubTitle title={t('setting_lyric_desktop_text_y')}>
      <View style={styles.list}>
        {
          list.map(({ id, name }) => <Item name={name} id={id} key={id} change={setDesktopLyricTextPosition} />)
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
