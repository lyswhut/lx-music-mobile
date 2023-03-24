import React, { useMemo } from 'react'

import { View } from 'react-native'
import Text from '@/components/common/Text'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import styles from './style'
import CheckBox from '@/components/common/CheckBox'

type Align_Type = LX.AppSetting['playDetail.style.align']

const ALIGN_LIST = [
  'left',
  'center',
  'right',
] as const

const useActive = (id: Align_Type) => {
  const x = useSettingValue('playDetail.style.align')
  const isActive = useMemo(() => x == id, [x, id])
  return isActive
}

const Item = ({ id, name, change }: {
  id: Align_Type
  name: string
  change: (id: Align_Type) => void
}) => {
  const isActive = useActive(id)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => { change(id) }} need />
}

export default () => {
  const t = useI18n()
  const list = useMemo(() => {
    return ALIGN_LIST.map(id => ({ id, name: t(`play_detail_setting_lrc_align_${id}`) }))
  }, [t])

  const setPosition = (id: Align_Type) => {
    updateSetting({ 'playDetail.style.align': id })
  }

  return (
    <View style={styles.container}>
      <Text>{t('play_detail_setting_lrc_align')}</Text>
      <View style={styles.content}>
        <View style={styles.list}>
          {
            list.map(({ id, name }) => <Item name={name} id={id} key={id} change={setPosition} />)
          }
        </View>
      </View>
    </View>
  )
}
