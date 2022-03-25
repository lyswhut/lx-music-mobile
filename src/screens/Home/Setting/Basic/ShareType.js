import React, { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'
import { useGetter, useDispatch } from '@/store'

import SubTitle from '../components/SubTitle'
import { useTranslation } from '@/plugins/i18n'
import CheckBox from '@/components/common/CheckBox'


const useActive = id => {
  const shareType = useGetter('common', 'shareType')
  const isActive = useMemo(() => shareType == id, [shareType, id])
  return isActive
}

const Item = ({ id, name, change }) => {
  const isActive = useActive(id)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => change(id)} need />
}

export default memo(() => {
  const { t } = useTranslation()
  const setShareType = useDispatch('common', 'setShareType')
  const list = useMemo(() => [
    {
      id: 'system',
      name: t('setting_basic_share_type_system'),
    },
    {
      id: 'clipboard',
      name: t('setting_basic_share_type_clipboard'),
    },
  ], [t])

  return (
    <SubTitle title={t('setting_basic_share_type')}>
      <View style={styles.list}>
        {
          list.map(({ id, name }) => <Item name={name} id={id} key={id} change={setShareType} />)
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
