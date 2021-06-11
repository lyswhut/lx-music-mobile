import React, { memo, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import SubTitle from '../components/SubTitle'
import { useTranslation } from '@/plugins/i18n'
import CheckBox from '@/components/common/CheckBox'


const useActive = id => {
  const addMusicLocationType = useGetter('common', 'addMusicLocationType')
  const isActive = useMemo(() => addMusicLocationType == id, [addMusicLocationType, id])
  return isActive
}

const Item = ({ id, name, change }) => {
  const isActive = useActive(id)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => change(id)} need />
}


export default memo(() => {
  const { t } = useTranslation()
  const setAddMusicLocationType = useDispatch('common', 'setAddMusicLocationType')

  return (
    <SubTitle title={t('setting_list_add_music_location_type')}>
      <View style={styles.list}>
        <Item id="top" change={setAddMusicLocationType} name={t('setting_list_add_music_location_type_top')} />
        <Item id="bottom" change={setAddMusicLocationType} name={t('setting_list_add_music_location_type_bottom')} />
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
