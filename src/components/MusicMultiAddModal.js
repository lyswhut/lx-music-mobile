import React, { useCallback, useMemo, memo } from 'react'
import { View, StyleSheet, Text, ScrollView } from 'react-native'
import Dialog from '@/components/common/Dialog'
import Button from '@/components/common/Button'
import { useGetter, useDispatch } from '@/store'
import { useTranslation } from '@/plugins/i18n'
import { useDimensions } from '@/utils/hooks'


const ListItem = ({ list, onPress, width }) => {
  const theme = useGetter('common', 'theme')

  return (
    <View style={{ ...styles.listItem, width: width }}>
      <Button
        style={{ ...styles.button, backgroundColor: theme.secondary45 }}
        onPress={() => { onPress(list) }}
      >
        <Text numberOfLines={1} style={{ fontSize: 12, color: theme.secondary }}>{list.name}</Text>
      </Button>
    </View>
  )
}

const Title = ({ list, isMove }) => {
  const theme = useGetter('common', 'theme')
  const { t } = useTranslation()
  return (
    list.length
      ? <Text style={styles.title}>{t(isMove ? 'list_multi_add_title_first_move' : 'list_multi_add_title_first_add')} <Text style={{ color: theme.secondary }} >{list.length}</Text> {t('list_multi_add_title_last')}</Text>
      : null
  )
}

export default memo(({ visible, hideModal, list, onAdd, excludeList = [], listId, isMove = false }) => {
  const allList = useGetter('list', 'allList')
  const addMultiMusicToList = useDispatch('list', 'listAddMultiple')
  const moveMultiMusicToList = useDispatch('list', 'listMoveMultiple')
  const { window } = useDimensions()

  const itemWidth = useMemo(() => {
    let w = window.width * 0.9 - 20
    let n = 1
    while (true) {
      if (w / n < 100 + n * 30 || n > 9) return parseInt(w / n)
      n++
    }
  }, [window])

  const handleSelect = useCallback(({ id }) => {
    if (isMove) {
      moveMultiMusicToList({
        fromId: listId,
        toId: id,
        list,
      })
    } else {
      addMultiMusicToList({
        list,
        id,
      })
    }
    hideModal()
    onAdd()
  }, [isMove, hideModal, onAdd, addMultiMusicToList, list, moveMultiMusicToList, listId])

  const filteredList = useMemo(() => {
    return allList.filter(({ id }) => !excludeList.includes(id))
  }, [allList, excludeList])

  return (
    <Dialog visible={visible} hideDialog={hideModal}>
      <Title list={list} isMove={isMove} />
      <View style={{ flexShrink: 1 }} onStartShouldSetResponder={() => true}>
        <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps={'always'}>
          <View style={{ ...styles.list }}>
            { filteredList.map(list => <ListItem key={list.id} list={list} onPress={handleSelect} width={itemWidth} />) }
          </View>
        </ScrollView>
      </View>
    </Dialog>
  )
})

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    padding: 15,
  },
  list: {
    paddingLeft: 15,
    paddingRight: 5,
    paddingBottom: 5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    // backgroundColor: 'rgba(0,0,0,0.2)'
  },
  listItem: {
    // width: '50%',
    paddingRight: 10,
  },
  button: {
    paddingTop: 9,
    paddingBottom: 9,
    paddingLeft: 10,
    paddingRight: 10,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
  },
})
