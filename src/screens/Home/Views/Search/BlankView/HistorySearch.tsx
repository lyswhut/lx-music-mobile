import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View } from 'react-native'
import { type InitState } from '@/store/hotSearch/state'
import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { getSearchHistory } from '@/core/search/search'


interface ListProps {
  onSearch: (keyword: string) => void
}
export interface HistorySearchType {
  show: () => void
}


export type List = NonNullable<InitState['sourceList'][keyof InitState['sourceList']]>

const ListItem = ({ keyword, onSearch }: {
  keyword: string
  onSearch: (keyword: string) => void
}) => {
  const theme = useTheme()
  return (
    <Button style={{ ...styles.button, backgroundColor: theme['c-button-background'] }} onPress={() => { onSearch(keyword) }}>
      <Text color={theme['c-button-font']} size={13}>{keyword}</Text>
    </Button>
  )
}

export default forwardRef<HistorySearchType, ListProps>((props, ref) => {
  const [list, setList] = useState<List>([])
  const isUnmountedRef = useRef(false)
  const t = useI18n()
  // const theme = useTheme()

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  useImperativeHandle(ref, () => ({
    show() {
      void getSearchHistory().then((list) => {
        if (isUnmountedRef.current) return
        setList(list)
      })
    },
  }), [])

  return (
    list.length
      ? (
          <View>
            <Text style={styles.title} size={16}>{t('search_history_search')}</Text>
            <View style={styles.list}>
              {
                list.map(keyword => <ListItem keyword={keyword} key={keyword} onSearch={props.onSearch} />)
              }
            </View>
          </View>
        )
      : null
  )
})


const styles = createStyle({
  title: {
    // paddingLeft: 15,
    paddingTop: 15,
    // paddingBottom: 5,
  },
  list: {
    // paddingLeft: 15,
    // paddingRight: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    // paddingBottom: 15,
  },
  button: {
    textAlign: 'center',
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 4,
    marginRight: 10,
    marginTop: 8,
  },
})
