import React, { useEffect, useMemo, useState } from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'

import { createStyle } from '@/utils/tools'
import { type SearchType } from '@/store/search/state'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { getSearchSetting } from '@/utils/data'

const SEARCH_TYPE_LIST = [
  'music',
  'songlist',
] as const

export default () => {
  const t = useI18n()
  const theme = useTheme()
  const [type, setType] = useState<SearchType>('music')

  useEffect(() => {
    void getSearchSetting().then(info => {
      setType(info.type)
    })
  }, [])

  const list = useMemo(() => {
    return SEARCH_TYPE_LIST.map(type => ({ label: t(`search_type_${type}`), id: type }))
  }, [t])

  const handleTypeChange = (type: SearchType) => {
    setType(type)
    global.app_event.searchTypeChanged(type)
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps={'always'} horizontal={true}>
      {
        list.map(t => (
          <TouchableOpacity style={styles.button} onPress={() => { handleTypeChange(t.id) }} key={t.id}>
            <Text style={styles.buttonText} color={type == t.id ? theme['c-primary-font-active'] : theme['c-font']}>{t.label}</Text>
          </TouchableOpacity>
        ))
      }
    </ScrollView>
  )
}

const styles = createStyle({
  container: {
    height: '100%',
    flexGrow: 0,
    flexShrink: 1,
    // paddingLeft: 5,
    // paddingRight: 5,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  button: {
    // height: 38,
    // lineHeight: 38,
    justifyContent: 'center',
    // width: 80,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  buttonText: {
    // height: 38,
    // lineHeight: 38,
    textAlign: 'center',
    paddingLeft: 10,
    paddingRight: 10,
    // paddingTop: 10,
    // paddingBottom: 10,
    // width: 80,
  },
})
