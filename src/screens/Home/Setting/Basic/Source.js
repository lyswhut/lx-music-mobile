import React, { memo, useCallback, useMemo } from 'react'

import { StyleSheet, View, InteractionManager } from 'react-native'
import { useGetter, useDispatch } from '@/store'

import SubTitle from '../components/SubTitle'
import { useTranslation } from '@/plugins/i18n'
import CheckBox from '@/components/common/CheckBox'

const useActive = id => {
  const activeLangId = useGetter('common', 'activeApiSourceId')
  const isActive = useMemo(() => activeLangId == id, [activeLangId, id])
  return isActive
}

const Item = ({ id, name, change }) => {
  const isActive = useActive(id)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => change(id)} need />
}

export default memo(() => {
  const { t } = useTranslation()
  const setApiSource = useDispatch('common', 'setApiSource')
  const apiSourceList = useGetter('common', 'apiSourceList')
  const list = useMemo(() => apiSourceList.map(s => ({
    name: t(`setting_basic_source_${s.id}`) || s.name,
    id: s.id,
  })), [apiSourceList, t])
  const setApiSourceId = useCallback((id) => {
    InteractionManager.runAfterInteractions(() => {
      setApiSource(id)
    })
  }, [setApiSource])

  return (
    <SubTitle title={t('setting_basic_source')}>
      <View style={styles.list}>
        {
          list.map(({ id, name }) => <Item name={name} id={id} key={id} change={setApiSourceId} />)
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
