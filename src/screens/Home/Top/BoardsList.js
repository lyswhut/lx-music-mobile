import React, { memo, useMemo, useEffect } from 'react'
import { StyleSheet, View, Text, ScrollView } from 'react-native'

import { useGetter, useDispatch } from '@/store'
import Button from '@/components/common/Button'
// import { useTranslation } from '@/plugins/i18n'


export default memo(() => {
  const theme = useGetter('common', 'theme')
  const setTop = useDispatch('common', 'setTop')
  const getBoardsList = useDispatch('top', 'getBoardsList')
  const boards = useGetter('top', 'boards')
  const sourceId = useGetter('top', 'sourceId')
  const tabId = useGetter('top', 'tabId')
  // const { t } = useTranslation()

  useEffect(() => {
    const list = boards[sourceId]
    if (list.length && !list.some(b => b.id == tabId)) {
      setTop({ tabId: list[0].id })
    }
  }, [boards])

  useEffect(() => {
    let list = boards[sourceId]
    if (list.length) {
      setTop({ tabId: list[0].id })
      return
    }
    getBoardsList().then(() => {
      list = boards[sourceId]
      setTop({ tabId: list.length ? list[0].id : null })
    })
  }, [sourceId])

  const list = useMemo(() => sourceId ? [...boards[sourceId]] : [], [boards, sourceId])

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps={'always'}>
        <View style={styles.list}>
          {
            list.map(item => (
              <Button style={styles.button} key={item.id} onPress={() => setTop({ tabId: item.id })}>
                <Text style={{ ...styles.buttonText, color: tabId == item.id ? theme.secondary : theme.normal }} numberOfLines={1}>{item.name}</Text>
              </Button>
            ))
          }
        </View>
      </ScrollView>
    </View>
  )
})


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollView: {
    flexShrink: 1,
  },
  list: {

  },
  button: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  buttonText: {
    fontSize: 12,
  },
})
