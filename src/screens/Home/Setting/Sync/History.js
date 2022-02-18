import React, { memo, useRef, useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useGetter } from '@/store'
// import { gzip, ungzip } from 'pako'
import { Icon } from '@/components/common/Icon'

import Button from '../components/Button'
import { useTranslation } from '@/plugins/i18n'
import { getSyncHostHistory, removeSyncHostHistory, setSyncHost } from '@/utils/tools'
import Popup from '@/components/common/Popup'
import { BorderWidths } from '@/theme'

const HistoryListItem = ({ item, index, remove, setHostInfo }) => {
  const theme = useGetter('common', 'theme')
  const handleSetHost = () => {
    setHostInfo({
      host: item.host,
      port: item.port,
    })
    setSyncHost({
      host: item.host,
      port: item.port,
    })
  }
  const handleRemove = () => {
    remove(index)
  }

  return (
    <View style={{ ...styles.listItem, borderBottomColor: theme.borderColor }}>
      <TouchableOpacity style={styles.listName} onPress={handleSetHost}>
        <Text numberOfLines={1} style={{ fontSize: 12, color: theme.normal }}>{item.host}</Text>
        <Text numberOfLines={1} style={{ fontSize: 12, color: theme.normal20 }}>{item.port}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleRemove} style={styles.listMoreBtn}>
        <Icon name="remove" style={{ color: theme.normal35 }} size={16} />
      </TouchableOpacity>
    </View>
  )
}
const HistoryList = ({ visible, setHostInfo }) => {
  const [list, setList] = useState([])
  const isUnmountedRef = useRef(true)
  const theme = useGetter('common', 'theme')
  const { t } = useTranslation()

  const getHistory = () => {
    getSyncHostHistory().then(historyList => {
      if (isUnmountedRef.current) return
      setList([...historyList])
    })
  }

  useEffect(() => {
    if (!visible) return
    getHistory()
  }, [visible])

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  const handleRemove = useCallback((index) => {
    removeSyncHostHistory(index)
    const newList = [...list]
    newList.splice(index, 1)
    setList(newList)
  }, [list])

  return (
    <ScrollView style={styles.list}>
      {
      list.length
        ? list.map((item, index) => <HistoryListItem item={item} index={index} remove={handleRemove} key={`${item.host}:${item.port}`} setHostInfo={setHostInfo} />)
        : <Text style={{ ...styles.tipText, color: theme.normal10 }}>{t('setting_sync_history_empty')}</Text>
    }
    </ScrollView>
  )
}

export default memo(({ setHostInfo, isWaiting }) => {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const isEnableSync = useGetter('common', 'isEnableSync')

  const showPopup = () => {
    setVisible(true)
  }

  const hidePopup = () => {
    setVisible(false)
  }

  return (
    <>
      <View style={styles.btn}>
        <Button disabled={isWaiting || isEnableSync} onPress={showPopup}>{t('setting_sync_history')}</Button>
      </View>
      <Popup
        visible={visible}
        hide={hidePopup}
        title={t('setting_sync_history_title')}
      >
        <HistoryList visible={visible} setHostInfo={setHostInfo} />
      </Popup>
    </>
  )
})

const styles = StyleSheet.create({
  cacheSize: {
    marginBottom: 5,
  },
  btn: {
    flexDirection: 'row',
    marginLeft: 25,
    marginBottom: 15,
  },
  tipText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
  },
  list: {
    flexShrink: 1,
    flexGrow: 0,
    paddingLeft: 10,
    paddingRight: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: 5,
    borderBottomWidth: BorderWidths.normal,
  },
  listName: {
    flex: 1,
  },
})
