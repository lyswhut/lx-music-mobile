import React, { memo, useCallback, useMemo } from 'react'

import { StyleSheet, View, InteractionManager } from 'react-native'
import { useGetter, useDispatch } from '@/store'

import SubTitle from '../components/SubTitle'
import { useTranslation, langList } from '@/plugins/i18n'
import CheckBox from '@/components/common/CheckBox'

const useActive = id => {
  const activeLangId = useGetter('common', 'activeLangId')
  const isActive = useMemo(() => activeLangId == id, [activeLangId, id])
  return isActive
}

const Item = ({ id, name, setLang }) => {
  const isActive = useActive(id)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return <CheckBox marginRight={8} check={isActive} label={name} onChange={() => setLang(id)} need />
}

export default memo(() => {
  const { t } = useTranslation()
  const setLang = useDispatch('common', 'setLang')
  const setLangId = useCallback((id) => {
    InteractionManager.runAfterInteractions(() => {
      setLang(id)
    })
  }, [setLang])

  return (
    <SubTitle title={t('setting_basic_lang')}>
      <View style={styles.list}>
        {
          langList.map(({ id, name }) => <Item name={name} id={id} key={id} setLang={setLangId} />)
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
