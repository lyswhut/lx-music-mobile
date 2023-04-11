import React, { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

type ShareType = LX.AppSetting['common.shareType']

const setShareType = (type: ShareType) => {
  updateSetting({ 'common.shareType': type })
}


const useActive = (type: ShareType) => {
  const shareType = useSettingValue('common.shareType')
  const isActive = useMemo(() => shareType == type, [shareType, type])
  return isActive
}

const Item = ({ id, name }: {
  id: ShareType
  name: string
}) => {
  const isActive = useActive(id)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => { setShareType(id) }} need />
}

export default memo(() => {
  const t = useI18n()
  const list = useMemo(() => {
    return [
      {
        id: 'system',
        name: t('setting_basic_share_type_system'),
      },
      {
        id: 'clipboard',
        name: t('setting_basic_share_type_clipboard'),
      },
    ] as const
  }, [t])

  return (
    <SubTitle title={t('setting_basic_share_type')}>
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
