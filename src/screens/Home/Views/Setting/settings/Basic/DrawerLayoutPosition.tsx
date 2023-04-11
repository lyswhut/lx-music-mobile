import React, { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

const LIST = [
  {
    position: 'left',
    name: 'setting_basic_drawer_layout_position_left',
  },
  {
    position: 'right',
    name: 'setting_basic_drawer_layout_position_right',
  },
] as const

const useActive = (id: LX.AppSetting['common.drawerLayoutPosition']) => {
  const drawerLayoutPosition = useSettingValue('common.drawerLayoutPosition')
  const isActive = useMemo(() => drawerLayoutPosition == id, [drawerLayoutPosition, id])
  return isActive
}

const Item = ({ position, label }: {
  position: LX.AppSetting['common.drawerLayoutPosition']
  label: string
}) => {
  const isActive = useActive(position)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return <CheckBox marginRight={8} check={isActive} label={label} onChange={() => { updateSetting({ 'common.drawerLayoutPosition': position }) }} need />
}

export default memo(() => {
  const t = useI18n()

  const list = useMemo(() => {
    return LIST.map((item) => ({ position: item.position, name: t(item.name) }))
  }, [t])

  return (
    <SubTitle title={t('setting_basic_drawer_layout_position')}>
      <View style={styles.list}>
        {
          list.map(({ position, name }) => <Item key={position} position={position} label={name} />)
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
