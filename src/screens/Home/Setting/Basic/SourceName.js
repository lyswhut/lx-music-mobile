import React, { memo, useCallback, useMemo } from 'react'

import { StyleSheet, View, InteractionManager } from 'react-native'
import { useGetter, useDispatch } from '@/store'

import SubTitle from '../components/SubTitle'
import { useTranslation } from '@/plugins/i18n'
import CheckBox from '@/components/common/CheckBox'

const useActive = id => {
  const activeId = useGetter('common', 'sourceNameType')
  const isActive = useMemo(() => activeId == id, [activeId, id])
  return isActive
}

const Item = ({ id, name, change }) => {
  const isActive = useActive(id)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => change(id)} need />
}

export default memo(() => {
  const { t } = useTranslation()
  const setSourceNameType = useDispatch('common', 'setSourceNameType')
  const list = useMemo(() => [
    {
      id: 'real',
      name: t('setting_basic_sourcename_real'),
    },
    {
      id: 'alias',
      name: t('setting_basic_sourcename_alias'),
    },
  ], [t])
  const setSourceNameTypeId = useCallback((id) => {
    InteractionManager.runAfterInteractions(() => {
      setSourceNameType(id)
    })
  }, [setSourceNameType])

  return (
    <SubTitle title={t('setting_basic_sourcename')}>
      <View style={styles.list}>
        {
          list.map(({ id, name }) => <Item name={name} id={id} key={id} change={setSourceNameTypeId} />)
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
