import React, { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

const setAddMusicLocationType = (type: LX.AddMusicLocationType) => {
  updateSetting({ 'list.addMusicLocationType': type })
}

const useActive = (id: LX.AddMusicLocationType) => {
  const addMusicLocationType = useSettingValue('list.addMusicLocationType')
  const isActive = useMemo(() => addMusicLocationType == id, [addMusicLocationType, id])
  return isActive
}

const Item = ({ id, name }: {
  id: LX.AddMusicLocationType
  name: string
}) => {
  const isActive = useActive(id)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return <CheckBox marginRight={8} check={isActive} label={name} onChange={() => { setAddMusicLocationType(id) }} need />
}


export default memo(() => {
  const t = useI18n()

  return (
    <SubTitle title={t('setting_list_add_music_location_type')}>
      <View style={styles.list}>
        <Item id="top" name={t('setting_list_add_music_location_type_top')} />
        <Item id="bottom" name={t('setting_list_add_music_location_type_bottom')} />
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
