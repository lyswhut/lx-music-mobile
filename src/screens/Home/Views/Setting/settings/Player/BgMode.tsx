import { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'

type BgMode = LX.AppSetting['playDetail.bgMode']

const BG_MODE_LIST: Array<{ id: BgMode, name: 'setting_play_detail_bg_mode_cover' | 'setting_play_detail_bg_mode_gradient' | 'setting_play_detail_bg_mode_none' }> = [
  { id: 'cover', name: 'setting_play_detail_bg_mode_cover' },
  { id: 'gradient', name: 'setting_play_detail_bg_mode_gradient' },
  { id: 'none', name: 'setting_play_detail_bg_mode_none' },
]

const useActive = (id: BgMode) => {
  const bgMode = useSettingValue('playDetail.bgMode')
  return useMemo(() => bgMode == id, [bgMode, id])
}

const Item = ({ id, name }: {
  id: BgMode
  name: string
}) => {
  const isActive = useActive(id)
  return <CheckBox marginRight={4} check={isActive} label={name} onChange={() => { updateSetting({ 'playDetail.bgMode': id }) }} need />
}

export default memo(() => {
  const t = useI18n()

  return (
    <SubTitle title={t('setting_play_detail_bg_mode')}>
      <View style={styles.list}>
        {
          BG_MODE_LIST.map(({ id, name }) => <Item name={t(name)} id={id} key={id} />)
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
  },
})
