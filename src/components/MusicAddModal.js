import React, { useCallback, useMemo, memo } from 'react'
import { View, StyleSheet, Text, ScrollView } from 'react-native'
import Dialog from '@/components/common/Dialog'
import Button from '@/components/common/Button'
import { useGetter, useDispatch } from '@/store'
import { useTranslation } from '@/plugins/i18n'
import { useDimensions } from '@/utils/hooks'


const ListItem = ({ list, onPress, musicInfo, width }) => {
  const theme = useGetter('common', 'theme')
  const isDisabled = useMemo(() => {
    return list.list.some(s => s.songmid == musicInfo.songmid)
  }, [list, musicInfo])

  return (
    <View style={{ ...styles.listItem, width: width }}>
      <Button
        disabled={isDisabled}
        style={{ ...styles.button, backgroundColor: theme.secondary45, opacity: isDisabled ? 0.6 : 1 }}
        onPress={() => { onPress(list) }}
      >
        <Text numberOfLines={1} style={{ fontSize: 12, color: isDisabled ? theme.secondary10 : theme.secondary }}>{list.name}</Text>
      </Button>
    </View>
  )
}

const Title = ({ musicInfo, isMove }) => {
  const theme = useGetter('common', 'theme')
  const { t } = useTranslation()
  return (
    musicInfo
      ? <Text style={styles.title}>{t(isMove ? 'list_add_title_first_move' : 'list_add_title_first_add')} <Text style={{ color: theme.secondary }} >{musicInfo.name}</Text> {t('list_add_title_last')}</Text>
      : null
  )
}

export default memo(({ visible, hideModal, musicInfo, listId, isMove = false }) => {
  const allList = useGetter('list', 'allList')
  const addMusicToList = useDispatch('list', 'listAdd')
  const moveMusicToList = useDispatch('list', 'listMove')
  const { window } = useDimensions()

  const itemWidth = useMemo(() => {
    let w = window.width * 0.9 - 20
    let n = 1
    while (true) {
      if (w / n < 100 + n * 30 || n > 9) return parseInt(w / n)
      n++
    }
  }, [window])

  const handleSelect = useCallback(list => {
    if (isMove) {
      moveMusicToList({
        fromId: listId,
        toId: list.id,
        musicInfo,
      })
    } else {
      addMusicToList({
        musicInfo,
        id: list.id,
      })
    }
    hideModal()
  }, [addMusicToList, hideModal, isMove, listId, moveMusicToList, musicInfo])

  return (
    <Dialog visible={visible} hideDialog={hideModal}>
      <Title musicInfo={musicInfo} isMove={isMove} />
      <View style={{ flexShrink: 1 }} onStartShouldSetResponder={() => true}>
        <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps={'always'}>
          <View style={{ ...styles.list }}>
            { allList.map(list => <ListItem key={list.id} list={list} musicInfo={musicInfo} onPress={handleSelect} width={itemWidth} />) }
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
