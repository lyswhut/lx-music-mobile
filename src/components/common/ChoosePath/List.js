import React, { useEffect, useState, useRef, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { readDir, externalStorageDirectoryPath } from '@/utils/fs'
import { toast } from '@/utils/tools'
// import { useTranslation } from '@/plugins/i18n'
import { useGetter, useDispatch } from '@/store'
import Modal from '@/components/common/Modal'

import Header from './components/Header'
import Main from './components/Main'
import Footer from './components/Footer'
import { sizeFormate } from '@/utils'
// let prevPath = externalStorageDirectoryPath

const caches = {}

const handleReadDir = (path, dirOnly, filter, isRefresh = false) => {
  const cacheKey = `${path}_${dirOnly ? 'true' : 'false'}_${filter ? filter.toString() : 'null'}`
  if (!isRefresh && caches[cacheKey]) return Promise.resolve(caches[cacheKey])
  return readDir(path).then(paths => {
    // console.log('read')
    // prevPath = path
    const list = []
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
    caches[cacheKey] = list
    return list
  })
}

export default ({ dirOnly = false, filter, onConfirm, title, granted, visible, hide }) => {
  const [path, setPath] = useState(externalStorageDirectoryPath)
  const [list, setList] = useState([])
  const isUnmountedRef = useRef(true)
  const isReadingDir = useRef(false)
  const theme = useGetter('common', 'theme')

  useEffect(() => {
    isUnmountedRef.current = false
    return () => isUnmountedRef.current = true
  }, [])

  const readDir = useCallback((path, dirOnly, filter, isRefresh) => {
    if (isReadingDir.current) return
    isReadingDir.current = true
    return handleReadDir(path, dirOnly, filter, isRefresh).then(list => {
      if (isUnmountedRef.current) return
      setList(list)
      setPath(path)
    }).catch(err => {
      toast(`Read dir error: ${err.message}`, 'long')
      // console.log('prevPath', prevPath)
      // if (isReadingDir.current) return
      // setPath(prevPath)
    }).finally(() => {
      isReadingDir.current = false
    })
  }, [setPath])

  useEffect(() => {
    // console.log(granted)
    if (!granted) return
    readDir(path, dirOnly, filter)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granted, filter, dirOnly])

  const onSetPath = useCallback(pathInfo => {
    // console.log('onSetPath')
    if (pathInfo.isDir) {
      readDir(pathInfo.path, dirOnly, filter)
    } else {
      onConfirm(pathInfo.path)
      // setPath(pathInfo.path)
    }
  }, [dirOnly, filter, onConfirm, readDir])


  const toParentDir = useCallback(() => {
    const parentPath = path.substring(0, path.lastIndexOf('/'))
    readDir(parentPath.length ? parentPath : externalStorageDirectoryPath, dirOnly, filter)
  }, [dirOnly, filter, path, readDir])

  // const dirList = useMemo(() => [parentDir, ...list], [list, parentDir])

  return (
    <Modal visible={visible} hideModal={hide} bgHide={false}>
      <View style={{ ...styles.container, backgroundColor: theme.primary }}>
        <Header refreshDir={path => readDir(path, dirOnly, filter, true)} title={title} path={path} />
        <Main list={list} granted={granted} toParentDir={toParentDir} onSetPath={onSetPath} />
        <Footer onConfirm={() => onConfirm(path)} hide={hide} dirOnly={dirOnly} />
      </View>
    </Modal>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

