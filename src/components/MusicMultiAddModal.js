import React, { useCallback, useMemo, memo, useState, useRef, useEffect } from 'react'
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native'
import Dialog from '@/components/common/Dialog'
import Button from '@/components/common/Button'
import { useGetter, useDispatch } from '@/store'
import { useTranslation } from '@/plugins/i18n'
import { useDimensions } from '@/utils/hooks'
import { BorderWidths } from '@/theme'
import Input from '@/components/common/Input'
import { toast } from '@/utils/tools'


const ListItem = ({ list, onPress, width }) => {
  const theme = useGetter('common', 'theme')

  return (
    <View style={{ ...styles.listItem, width: width }}>
      <Button
        style={{ ...styles.button, backgroundColor: theme.secondary45, borderColor: theme.secondary45 }}
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

const CreateUserList = ({ isEdit, hideEdit }) => {
  const [text, setText] = useState('')
  const inputRef = useRef()
  const { t } = useTranslation()
  const theme = useGetter('common', 'theme')
  const createUserList = useDispatch('list', 'createUserList')

  useEffect(() => {
    if (isEdit) {
      setText('')
      global.requestAnimationFrame(() => {
        inputRef.current.focus()
      })
    }
  }, [isEdit])

  const handleSubmitEditing = () => {
    hideEdit()
    const name = text.trim()
    if (!name.length) return
    createUserList({ name })
  }

  return isEdit
    ? (
      <View style={styles.imputContainer}>
        <Input
          placeholder={t('list_create_input_placeholder')}
          value={text}
          onChangeText={setText}
          ref={inputRef}
          onBlur={handleSubmitEditing}
          onSubmitEditing={handleSubmitEditing}
          style={{ ...styles.input, backgroundColor: theme.secondary45 }}
        />
      </View>
      )
    : null
}

export default memo(({ visible, hideModal, list, onAdd, excludeList = [], listId, isMove = false }) => {
  const allList = useGetter('list', 'allList')
  const addMultiMusicToList = useDispatch('list', 'listAddMultiple')
  const moveMultiMusicToList = useDispatch('list', 'listMoveMultiple')
  const { window } = useDimensions()
  const theme = useGetter('common', 'theme')
  const [isEdit, setIsEdit] = useState(false)
  const { t } = useTranslation()

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
      toast(t('list_edit_action_tip_move_success'))
    } else {
      addMultiMusicToList({
        list,
        id,
      })
      toast(t('list_edit_action_tip_add_success'))
    }
    hideModal()
    onAdd()
  }, [isMove, hideModal, onAdd, moveMultiMusicToList, listId, list, t, addMultiMusicToList])

  const filteredList = useMemo(() => {
    return allList.filter(({ id }) => !excludeList.includes(id))
  }, [allList, excludeList])

  const hideEdit = useCallback(() => {
    setIsEdit(false)
  }, [])

  useEffect(() => {
    if (!visible) {
      hideEdit()
    }
  }, [hideEdit, visible])

  return (
    <Dialog visible={visible} hideDialog={hideModal}>
      <Title list={list} isMove={isMove} />
      <View style={{ flexShrink: 1 }} onStartShouldSetResponder={() => true}>
        <ScrollView style={{ flexGrow: 0 }}>
          <View style={{ ...styles.list }}>
            { filteredList.map(list => <ListItem key={list.id} list={list} onPress={handleSelect} width={itemWidth} />) }
            <View style={{ ...styles.listItem, width: itemWidth }}>
              <TouchableOpacity
                style={{ ...styles.button, borderColor: theme.secondary20, borderStyle: 'dashed' }}
                onPress={() => setIsEdit(true)}>
                <Text numberOfLines={1} style={{ fontSize: 12, color: theme.secondary }}>{t('list_create')}</Text>
              </TouchableOpacity>
              {
                isEdit
                  ? (
                      <View style={styles.imputContainer}>
                        <CreateUserList
                          isEdit={isEdit}
                          hideEdit={hideEdit}
                        />
                      </View>
                    )
                  : null
              }
            </View>
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
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
    borderWidth: BorderWidths.normal2,
  },
  imputContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    // paddingRight: 10,
    // paddingBottom: 10,
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  input: {
    fontSize: 12,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 4,
    width: '100%',
    textAlign: 'center',
  },
})
