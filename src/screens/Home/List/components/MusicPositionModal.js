import React, { memo, useMemo, useEffect, useCallback, useState, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useGetter, useDispatch } from '@/store'
import { useTranslation } from '@/plugins/i18n'
import ConfirmAlert from '@/components/common/ConfirmAlert'
import Input from '@/components/common/Input'

export default memo(({ visible, hideModal, onConfirm, selectedList, selectedData }) => {
  const [text, setText] = useState('')
  const theme = useGetter('common', 'theme')
  const { t } = useTranslation()
  const inputRef = useRef()

  const title = useMemo(() => {
    return selectedList.length
      ? t('change_position_music_multi_title', { num: selectedList.length })
      : t('change_position_music_title', { name: selectedData ? selectedData.name : '' })
  }, [selectedData, selectedList, t])

  const verify = useCallback(() => {
    let num = /^[1-9]\d*/.exec(text)
    num = num ? parseInt(num[0]) : ''
    setText(num.toString())
    return num
  }, [text])
  const handleSetMusicPosition = useCallback(() => {
    let num = verify()
    if (num == '') return
    onConfirm(num)
  }, [onConfirm, verify])
  useEffect(() => {
    if (!visible) return

    setText('')
    inputRef.current.focus()
  }, [visible])


  return (
    <ConfirmAlert
        visible={visible}
        onCancel={hideModal}
        onConfirm={handleSetMusicPosition}
        >
        <View style={styles.content}>
          <Text style={{ color: theme.normal, marginBottom: 5 }}>{title}</Text>
          <Input
            placeholder={t('change_position_tip')}
            value={text}
            onChangeText={setText}
            ref={inputRef}
            style={{ ...styles.input, backgroundColor: theme.secondary40 }}
          />
        </View>
      </ConfirmAlert>
  )
})

const styles = StyleSheet.create({
  content: {
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

  // tagTypeList: {
  //   flexDirection: 'row',
  //   flexWrap: 'wrap',
  // },
  // tagButton: {
  //   // marginRight: 10,
  //   borderRadius: 4,
  //   marginRight: 10,
  //   marginBottom: 10,
  // },
  // tagButtonText: {
  //   paddingLeft: 12,
  //   paddingRight: 12,
  //   paddingTop: 8,
  //   paddingBottom: 8,
  // },
})
