import React, { useCallback, memo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Button from '@/components/common/Button'

import { useGetter, useDispatch } from '@/store'
import { useTranslation } from '@/plugins/i18n'
import { toast } from '@/utils/tools'
import { LIST_ID_PLAY_TEMP } from '@/config/constant'

export default memo(() => {
  const selectListInfo = useGetter('songList', 'selectListInfo')
  const listDetailData = useGetter('songList', 'listDetailData')
  const setPlayList = useDispatch('player', 'setList')
  const setVisibleListDetail = useDispatch('songList', 'setVisibleListDetail')
  const getListDetailAll = useDispatch('songList', 'getListDetailAll')
  const createUserList = useDispatch('list', 'createUserList')
  const { t } = useTranslation()
  const theme = useGetter('common', 'theme')

  const handlePlayAll = useCallback(async() => {
    if (!listDetailData.info.name) return
    const list = await getListDetailAll(selectListInfo.id)
    if (!list.length) return
    setPlayList({
      list: {
        list,
        id: LIST_ID_PLAY_TEMP,
      },
      index: 0,
    })
  }, [getListDetailAll, listDetailData.info, selectListInfo.id, setPlayList])

  const handleCollection = useCallback(async() => {
    if (!listDetailData.info.name) return
    const list = await getListDetailAll(selectListInfo.id)
    createUserList({
      name: listDetailData.info.name,
      id: `${listDetailData.source}__${listDetailData.id}`,
      list,
      source: listDetailData.source,
      sourceListId: listDetailData.id,
      isShowToast: true,
    })
    toast(t('collect_success'))
  }, [listDetailData, getListDetailAll, selectListInfo.id, createUserList, t])

  const handleBack = () => setVisibleListDetail(false)

  return (
    <View style={styles.container}>
      <Button onPress={handleCollection} style={styles.controlBtn}>
        <Text style={{ ...styles.controlBtnText, color: theme.secondary }}>{t('collect_songlist')}</Text>
      </Button>
      <Button onPress={handlePlayAll} style={styles.controlBtn}>
        <Text style={{ ...styles.controlBtnText, color: theme.secondary }}>{t('play_all')}</Text>
      </Button>
      <Button onPress={handleBack} style={styles.controlBtn}>
        <Text style={{ ...styles.controlBtnText, color: theme.secondary }}>{t('back')}</Text>
      </Button>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
  },
  controlBtn: {
    flexGrow: 1,
    flexShrink: 1,
    width: '33%',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 10,
    paddingRight: 10,
  },
  controlBtnText: {
    fontSize: 13,
    textAlign: 'center',
  },
})

