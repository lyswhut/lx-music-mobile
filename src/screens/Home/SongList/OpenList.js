import React, { useCallback, memo, useMemo, useEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
// import Icon from '@/components/common/Icon'
import { useGetter, useDispatch } from '@/store'
import { useTranslation } from '@/plugins/i18n'
import Button from '@/components/common/Button'
import ConfirmAlert from '@/components/common/ConfirmAlert'
import Input from '@/components/common/Input'
import { navigations } from '@/navigation'

export default memo(() => {
  const theme = useGetter('common', 'theme')
  const { t } = useTranslation()
  const [visibleAlert, setVisibleAlert] = useState(false)
  const [text, setText] = useState('')
  const setSelectListInfo = useDispatch('songList', 'setSelectListInfo')
  const songListSource = useGetter('songList', 'songListSource')
  const componentIds = useGetter('common', 'componentIds')

  const handleShowMusicAddModal = () => {
    setText('')
    setVisibleAlert(true)
  }

  const handleCancelOpen = useCallback(() => {
    setVisibleAlert(false)
  }, [])
  const handleOpen = useCallback(() => {
    if (!text.length) return
    setSelectListInfo({
      play_count: null,
      id: text,
      author: '',
      name: '',
      img: null,
      desc: '',
      source: songListSource,
    })
    setVisibleAlert(false)
    navigations.pushSonglistDetailScreen(componentIds.home)
  }, [componentIds.home, setSelectListInfo, songListSource, text])


  return (
    <>
      <Button style={{ ...styles.button }} onPress={handleShowMusicAddModal}>
        <Text style={{ ...styles.buttonText, color: theme.normal }}>{t('songlist_open')}</Text>
      </Button>
      <ConfirmAlert
        visible={visibleAlert}
        onCancel={handleCancelOpen}
        onConfirm={handleOpen}
        >
        <View style={styles.alertContent}>
          <Input
            placeholder={t('songlist_open_input_placeholder')}
            value={text}
            onChangeText={setText}
            style={{ ...styles.input, backgroundColor: theme.secondary40 }}
          />
          <Text style={{ ...styles.inputTipText, color: theme.normal20 }}>{t('songlist_open_input_tip')}</Text>
        </View>
      </ConfirmAlert>
    </>
  )
})

const styles = StyleSheet.create({
  button: {
    // backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
    paddingRight: 12,
  },
  buttonText: {
    fontSize: 14,
  },

  alertContent: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 240,
    borderRadius: 4,
    paddingTop: 2,
    paddingBottom: 2,
    fontSize: 12,
  },
  inputTipText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
  },
})
