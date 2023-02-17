import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { View } from 'react-native'
import { readDir, externalStorageDirectoryPath } from '@/utils/fs'
import { createStyle, toast } from '@/utils/tools'
// import { useTranslation } from '@/plugins/i18n'
import Modal, { type ModalType } from '@/components/common/Modal'

import Header from './components/Header'
import Main from './components/Main'
import Footer from './components/Footer'
import { sizeFormate } from '@/utils'
import { useTheme } from '@/store/theme/hook'
import { type PathItem } from './components/ListItem'
// let prevPath = externalStorageDirectoryPath

const caches = new Map<string, PathItem[]>()

const handleReadDir = async(path: string, dirOnly: boolean, filter?: RegExp, isRefresh = false) => {
  const cacheKey = `${path}_${dirOnly ? 'true' : 'false'}_${filter ? filter.toString() : 'null'}`
  if (!isRefresh && caches.has(cacheKey)) return caches.get(cacheKey) as PathItem[]
  return readDir(path).then(paths => {
    // console.log('read')
    // prevPath = path
    const list = [] as PathItem[]
    // console.log(paths)
    for (const path of paths) {
      // console.log(path)
      const isDirectory = path.isDirectory()
      if (dirOnly) {
        if (!isDirectory) continue
        list.push({
          name: path.name,
          path: path.path,
          mtime: path.mtime,
          size: path.size,
          isDir: true,
          sizeText: '',
        })
      } else {
        if (filter != null && path.isFile() && !filter.test(path.name)) continue

        list.push({
          name: path.name,
          path: path.path,
          mtime: path.mtime,
          size: path.size,
          isDir: isDirectory,
          sizeText: isDirectory ? '' : sizeFormate(path.size),
        })
      }
    }

    list.sort((a, b) => a.name.charCodeAt(0) - b.name.charCodeAt(0))
    caches.set(cacheKey, list)
    return list
  })
}

interface ReadOptions {
  title: string
  dirOnly: boolean
  filter?: RegExp
}
const initReadOptions = {}
export interface ListProps {
  onConfirm: (path: string) => void
  onHide?: () => void
}

export interface ListType {
  show: (title: string, dirOnly?: boolean, filter?: RegExp) => void
  hide: () => void
}

export default forwardRef<ListType, ListProps>(({
  onConfirm,
  onHide = () => {},
}: ListProps, ref) => {
  const [path, setPath] = useState(externalStorageDirectoryPath)
  const [list, setList] = useState<PathItem[]>([])
  const isUnmountedRef = useRef(true)
  const readOptions = useRef<ReadOptions>(initReadOptions as ReadOptions)
  const isReadingDir = useRef(false)
  const modalRef = useRef<ModalType>(null)
  const theme = useTheme()

  useImperativeHandle(ref, () => ({
    show(title, dirOnly = false, filter) {
      readOptions.current = {
        title,
        dirOnly,
        filter,
      }
      modalRef.current?.setVisible(true)
      void readDir(path, dirOnly, filter)
    },
    hide() {
      modalRef.current?.setVisible(false)
    },
  }))

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  const readDir = async(path: string, dirOnly: boolean, filter?: RegExp, isRefresh?: boolean) => {
    if (isReadingDir.current) return
    isReadingDir.current = true
    return handleReadDir(path, dirOnly, filter, isRefresh).then(list => {
      if (isUnmountedRef.current) return
      setList(list)
      setPath(path)
    }).catch((err: any) => {
      toast(`Read dir error: ${err.message as string}`, 'long')
      // console.log('prevPath', prevPath)
      // if (isReadingDir.current) return
      // setPath(prevPath)
    }).finally(() => {
      isReadingDir.current = false
    })
  }

  const onSetPath = (pathInfo: PathItem) => {
    // console.log('onSetPath')
    if (pathInfo.isDir) {
      void readDir(pathInfo.path, readOptions.current.dirOnly, readOptions.current.filter)
    } else {
      onConfirm(pathInfo.path)
      // setPath(pathInfo.path)
    }
  }

  const toParentDir = () => {
    const parentPath = path.substring(0, path.lastIndexOf('/'))
    void readDir(parentPath.length ? parentPath : externalStorageDirectoryPath, readOptions.current.dirOnly, readOptions.current.filter)
  }

  const handleHide = () => {
    modalRef.current?.setVisible(false)
    onHide()
  }

  // const dirList = useMemo(() => [parentDir, ...list], [list, parentDir])

  return (
    <Modal ref={modalRef} bgHide={false} statusBarPadding={false}>
      <View style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}>
        <Header
          onRefreshDir={async(path) => readDir(path, readOptions.current.dirOnly, readOptions.current.filter, true)}
          title={readOptions.current.title}
          path={path} />
        <Main list={list} toParentDir={toParentDir} onSetPath={onSetPath} />
        <Footer onConfirm={() => { onConfirm(path) }} onHide={handleHide} dirOnly={readOptions.current.dirOnly} />
      </View>
    </Modal>
  )
})


const styles = createStyle({
  container: {
    flex: 1,
  },
})

