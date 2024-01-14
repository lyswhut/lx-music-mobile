import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { View } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import Text from '@/components/common/Text'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import { createStyle, toast } from '@/utils/tools'
import { getManagedFolders, stat, removeManagedFolder, selectManagedFolder } from '@/utils/fs'
import { useTheme } from '@/store/theme/hook'
import { getOpenStoragePath, saveOpenStoragePath } from '@/utils/data'
import Button from '@/components/common/Button'
import ButtonPrimary from '@/components/common/ButtonPrimary'
import { useUnmounted } from '@/utils/hooks'
import { Icon } from '@/components/common/Icon'
import type { PathItem } from './ListItem'
const filterFileName = /[\\:*?#"<>|]/


interface PathInputType {
  setPath: (text: string) => void
  getText: () => string
  focus: () => void
}
const PathInput = forwardRef<PathInputType, {}>((props, ref) => {
  const theme = useTheme()
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)

  useImperativeHandle(ref, () => ({
    getText() {
      return text.trim()
    },
    setPath(text) {
      setText(text)
    },
    focus() {
      inputRef.current?.focus()
    },
  }))

  return (
    <Input
      ref={inputRef}
      placeholder={global.i18n.t('open_storage_tip')}
      value={text}
      onChangeText={setText}
      multiline
      numberOfLines={3}
      textAlignVertical='top'
      style={{ ...styles.input, backgroundColor: theme['c-primary-input-background'] }}
    />
  )
})

export interface OpenDirModalType {
  show: (paths: string[]) => void
}
export default forwardRef<OpenDirModalType, { onOpenDir: (dir: string) => Promise<PathItem[]> }>(({
  onOpenDir,
}, ref) => {
  const confirmAlertRef = useRef<ConfirmAlertType>(null)
  const inputRef = useRef<PathInputType>(null)
  const [paths, setPaths] = useState<string[]>([])
  const [contentPaths, setContentPaths] = useState<string[]>([])
  const isUnmounted = useUnmounted()
  const theme = useTheme()

  useImperativeHandle(ref, () => ({
    show(paths) {
      setPaths(paths)
      void getManagedFolders().then((dirs) => {
        setContentPaths(dirs)
      })
      confirmAlertRef.current?.setVisible(true)
      requestAnimationFrame(() => {
        void getOpenStoragePath().then(path => {
          if (path) inputRef.current?.setPath(path)
        })
      })
    },
  }))

  // const handleHideAlert = () => {
  //   inputRef.current?.setPath('')
  // }
  const handleConfirmAlert = async() => {
    const text = inputRef.current?.getText() ?? ''
    if (text) {
      if (!text.startsWith('content://') && (!text.startsWith('/') || filterFileName.test(text))) {
        toast(global.i18n.t('open_storage_error_tip'), 'long')
        return
      }
      try {
        if (!(await stat(text)).canRead) {
          toast('Permission denied', 'long')
          return
        }
      } catch (err: any) {
        toast('Open failed: ' + err.message, 'long')
        return
      }
      void onOpenDir(text)
    }
    void saveOpenStoragePath(text)
    confirmAlertRef.current?.setVisible(false)
  }
  const removeSelectStoragePath = (path: string) => {
    void removeManagedFolder(path).then(async() => {
      return getManagedFolders().then((dirs) => {
        setContentPaths(dirs)
      })
    })
  }
  const handleSelectStorage = () => {
    void selectManagedFolder(true).then((dir) => {
      if (!dir || isUnmounted.current) return
      void onOpenDir(dir.path)
      confirmAlertRef.current?.setVisible(false)
    }).catch((err) => {
      toast(global.i18n.t('open_storage_select_managed_folder_failed_tip', { msg: err.message }))
    })
  }

  return (
    <ConfirmAlert
      onConfirm={handleConfirmAlert}
      ref={confirmAlertRef}
    >
      <View style={styles.newFolderContent} onStartShouldSetResponder={() => true}>
        <Text style={styles.newFolderTitle}>
          {
            paths.length > 1
              ? global.i18n.t('open_storage_title')
              : global.i18n.t('open_storage_not_found_title')
          }
        </Text>
        <PathInput ref={inputRef} />
        <View style={styles.list}>
          {
            paths.map(path => {
              return (
                <Button style={styles.pathBtn} key={path} onPress={() => inputRef.current?.setPath(path)}>
                  <Text size={12}>{path}</Text>
                </Button>
              )
            })
          }
          {
            contentPaths.map(path => {
              return (
                <View style={styles.listContentItem} key={path}>
                  <Button style={styles.pathBtn} onPress={() => inputRef.current?.setPath(path)}>
                    <Text size={12}>{path}</Text>
                  </Button>
                  <Button style={styles.removeBtn} onPress={() => { removeSelectStoragePath(path) }}>
                    <Icon color={theme['c-font-label']} name="close" size={12} />
                  </Button>
                </View>
              )
            })
          }
        </View>
        <View style={styles.tips}>
          <Text style={styles.tip} size={12}>
            {global.i18n.t('open_storage_select_path_tip')}
          </Text>
          <ButtonPrimary style={styles.btn} size={12} onPress={handleSelectStorage}>{global.i18n.t('open_storage_select_path')}</ButtonPrimary>
        </View>
      </View>
    </ConfirmAlert>
  )
})

const styles = createStyle({
  newFolderContent: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'column',
  },
  newFolderTitle: {
    marginBottom: 5,
    width: 300,
    maxWidth: '100%',
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 240,
    borderRadius: 4,
    paddingTop: 3,
    paddingBottom: 3,
    height: 'auto',
  },
  list: {
    flexGrow: 1,
    flexShrink: 1,
    marginVertical: 10,
  },
  listContentItem: {
    paddingVertical: 10,
    flexDirection: 'row',
  },
  pathBtn: {
    paddingHorizontal: 5,
    paddingVertical: 10,
    flex: 1,
  },
  removeBtn: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  tips: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },
  tip: {
    flex: 1,
  },
  btn: {
    // alignSelf: 'flex-end',
    flex: 0,
  },
})

