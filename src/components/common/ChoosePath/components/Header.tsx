import { memo, useCallback, useEffect, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { readDir } from '@/utils/fs'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { getExternalStoragePath } from '@/utils/nativeModules/utils'
import { useStatusbarHeight } from '@/store/common/hook'
import NewFolderModal, { type NewFolderType } from './NewFolderModal'
import OpenStorageModal, { type OpenDirModalType } from './OpenStorageModal'


export default memo(({
  title,
  path,
  onRefreshDir,
}: {
  title: string
  path: string
  onRefreshDir: (dir: string) => Promise<void>
}) => {
  const theme = useTheme()
  const newFolderTypeRef = useRef<NewFolderType>(null)
  const openDirModalTypeRef = useRef<OpenDirModalType>(null)
  const storagePathsRef = useRef<string[]>([])
  const statusBarHeight = useStatusbarHeight()

  const checkExternalStoragePath = useCallback(() => {
    storagePathsRef.current = []
    void getExternalStoragePath().then(async(storagePaths) => {
      for (const path of storagePaths) {
        try {
          await readDir(path)
        } catch { continue }
        storagePathsRef.current.push(path)
        break
      }
    })
  }, [])
  useEffect(() => {
    checkExternalStoragePath()
  }, [])

  const refresh = () => {
    void onRefreshDir(path)
    checkExternalStoragePath()
  }

  const toggleStorageDir = () => {
    if (storagePathsRef.current.length) {
      void onRefreshDir(storagePathsRef.current[0])
      return
    }
    openStorage()
  }
  const openStorage = () => {
    openDirModalTypeRef.current?.show(storagePathsRef.current)
  }

  const handleShowNewFolderModal = () => {
    newFolderTypeRef.current?.show(path)
  }

  return (
    <>
      <View style={{
        ...styles.header,
        height: scaleSizeH(50) + statusBarHeight,
        paddingTop: statusBarHeight,
        backgroundColor: theme['c-content-background'],
      }} onStartShouldSetResponder={() => true}>
        <View style={styles.titleContent}>
          <Text color={theme['c-primary-font']} numberOfLines={1}>{title}</Text>
          <Text style={styles.subTitle} color={theme['c-primary-font']} size={13} numberOfLines={1}>{path}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={toggleStorageDir} onLongPress={openStorage}>
            <Icon name="sd-card" color={theme['c-primary-font']} size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShowNewFolderModal}>
            <Icon name="add_folder" color={theme['c-primary-font']} size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={refresh}>
            <Icon name="available_updates" color={theme['c-primary-font']} size={22} />
          </TouchableOpacity>
        </View>
      </View>
      <OpenStorageModal ref={openDirModalTypeRef} onRefreshDir={onRefreshDir} />
      <NewFolderModal ref={newFolderTypeRef} onRefreshDir={onRefreshDir} />
    </>
  )
})

const styles = createStyle({
  header: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: 'row',
    paddingLeft: 15,
    paddingRight: 15,
    alignItems: 'center',
    elevation: 2,
    // borderBottomWidth: BorderWidths.normal,
  },
  titleContent: {
    flexGrow: 1,
    flexShrink: 1,
    // height: 57,
    // paddingRight: 5,
    // paddingBottom: 10,
  },
  // title: {
  //   paddingTop: 10,
  // },
  subTitle: {
    paddingTop: 1,
  },
  actions: {
    flexDirection: 'row',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  actionBtn: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 6,
    paddingRight: 6,
    marginLeft: 10,
  },
  newFolderContent: {
    flexShrink: 1,
    flexDirection: 'column',
  },
  newFolderTitle: {
    marginBottom: 5,
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 240,
    borderRadius: 4,
    paddingTop: 2,
    paddingBottom: 2,
  },
})

