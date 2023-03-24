import React, { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

type SourceNameType = LX.AppSetting['common.sourceNameType']

const setSourceNameType = (type: SourceNameType) => {
  updateSetting({ 'common.sourceNameType': type })
}


const useActive = (type: SourceNameType) => {
  const sourceNameType = useSettingValue('common.sourceNameType')
  const isActive = useMemo(() => sourceNameType == type, [sourceNameType, type])
  return isActive
}

const Item = ({ id, name }: {
  id: SourceNameType
  name: string
}) => {
  const isActive = useActive(id)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => { setSourceNameType(id) }} need />
}

export default memo(() => {
  const t = useI18n()
  const list = useMemo(() => {
    return [
      {
        id: 'real',
        name: t('setting_basic_sourcename_real'),
      },
      {
        id: 'alias',
        name: t('setting_basic_sourcename_alias'),
      },
    ] as const
  }, [t])

  return (
    <SubTitle title={t('setting_basic_sourcename')}>
      <View style={styles.list}>
        {
          list.map(({ id, name }) => <Item name={name} id={id} key={id} />)
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
