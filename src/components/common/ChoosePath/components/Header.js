import React, { useCallback, memo, useRef, useState } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, InteractionManager } from 'react-native'
import { useGetter } from '@/store'
import Icon from '@/components/common/Icon'
import Input from '@/components/common/Input'
import ConfirmAlert from '@/components/common/ConfirmAlert'
import { useTranslation } from '@/plugins/i18n'
import { toast } from '@/utils/tools'
import { mkdir } from '@/utils/fs'
const filterFileName = /[\\/:*?#"<>|]/

export default memo(({ title, path, refreshDir }) => {
  const theme = useGetter('common', 'theme')
  const [visibleNewFolder, setVisibleNewFolder] = useState(false)
  const { t } = useTranslation()
  const [text, setText] = useState('')
  // const moreButtonRef = useRef()
  // const handleShowMenu = useCallback(() => {
  //   if (moreButtonRef.current && moreButtonRef.current.measure) {
  //     moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
  //       // console.log(fx, fy, width, height, px, py)
  //       showMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
  //     })
  //   }
  // }, [item, index, showMenu])

  const refresh = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      refreshDir(path)
    })
  }, [refreshDir, path])

  const handleCancelNewFolderAlert = useCallback(() => {
    setVisibleNewFolder(false)
    setText('')
  }, [])
  const handleConfirmNewFolderAlert = useCallback(() => {
    if (filterFileName.test(text)) {
      toast(t('create_new_folder_error_tip'), 'long')
      return
    }
    const newPath = `${path}/${text}`
    mkdir(newPath).then(() => {
      refreshDir(path).then(() => {
        refreshDir(newPath)
      })
      setText('')
    }).catch(err => {
      toast('Create failed: ' + err.message)
    })
    setVisibleNewFolder(false)
  }, [path, refreshDir, t, text])

  return (
    <>
      <View style={{ ...styles.header, backgroundColor: theme.secondary }} onStartShouldSetResponder={() => true}>
        <View style={styles.titleContent}>
          <Text style={{ ...styles.title, color: theme.primary }} numberOfLines={1}>{title}</Text>
          <Text style={{ color: theme.primary, fontSize: 12 }} numberOfLines={1}>{path}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setVisibleNewFolder(true)}><Icon name="folder-plus" style={{ color: theme.primary, fontSize: 20 }} /></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={refresh}><Icon name="autorenew" style={{ color: theme.primary, fontSize: 20 }} /></TouchableOpacity>
        </View>
      </View>
      <ConfirmAlert
        visible={visibleNewFolder}
        onCancel={handleCancelNewFolderAlert}
        onConfirm={handleConfirmNewFolderAlert}
        >
        <View style={styles.newFolderContent}>
          <Text style={{ color: theme.normal, marginBottom: 5 }}>{t('create_new_folder')}</Text>
          <Input
            placeholder={t('create_new_folder_tip')}
            value={text}
            onChangeText={setText}
            style={{ ...styles.input, backgroundColor: theme.secondary40 }}
          />
        </View>
      </ConfirmAlert>
    </>
  )
})

const styles = StyleSheet.create({
  header: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: 'row',
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: StatusBar.currentHeight,
    alignItems: 'center',
  },
  titleContent: {
    flexGrow: 1,
    flexShrink: 1,
    height: 57,
    paddingRight: 5,
    // paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    paddingTop: 10,
  },
  actions: {
    flexDirection: 'row',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  actionBtn: {
    padding: 8,
  },
  newFolderContent: {
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
})

