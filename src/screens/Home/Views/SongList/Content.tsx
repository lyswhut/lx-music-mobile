import { getSongListSetting, saveSongListSetting } from '@/utils/data'
import { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'

// import List from './List/List'
import HeaderBar, { type HeaderBarProps, type HeaderBarType } from './HeaderBar'
import songlistState, { type InitState, type SortInfo } from '@/store/songlist/state'
import List, { type ListType } from './List'


interface SonglistInfo {
  source: InitState['sources'][number]
  sortId: SortInfo['id']
  tagId: string
}

export default () => {
  const headerBarRef = useRef<HeaderBarType>(null)
  const listRef = useRef<ListType>(null)
  const songlistInfo = useRef<SonglistInfo>({ source: 'kw', sortId: '5', tagId: '' })

  useEffect(() => {
    void getSongListSetting().then(info => {
      songlistInfo.current.source = info.source
      songlistInfo.current.sortId = info.sortId
      // 每次进入歌单页，标签行恢复默认选中第一个标签
      songlistInfo.current.tagId = ''
      void saveSongListSetting({ tagId: '', tagName: '' })
      headerBarRef.current?.setSource(info.source, info.sortId, '', '')
      listRef.current?.loadList(info.source, info.sortId, '')
    })

    const handleSortChange = (id: string) => {
      songlistInfo.current.sortId = id
      void saveSongListSetting({ sortId: id })
      listRef.current?.loadList(songlistInfo.current.source, id, songlistInfo.current.tagId)
    }
    global.app_event.on('songlistSortChanged', handleSortChange)

    const handleSourceChange = (source: InitState['sources'][number]) => {
      songlistInfo.current.source = source
      songlistInfo.current.tagId = ''
      songlistInfo.current.sortId = songlistState.sortList[source]![0].id
      void saveSongListSetting({ sortId: songlistInfo.current.sortId, source, tagId: '', tagName: '' })
      headerBarRef.current?.setSource(source, songlistInfo.current.sortId, '', songlistInfo.current.tagId)
      listRef.current?.loadList(source, songlistInfo.current.sortId, songlistInfo.current.tagId)
    }
    global.app_event.on('songlistSourceChanged', handleSourceChange)

    return () => {
      global.app_event.off('songlistSortChanged', handleSortChange)
      global.app_event.off('songlistSourceChanged', handleSourceChange)
    }
  }, [])

  const handleTagChange: HeaderBarProps['onTagChange'] = (name, id) => {
    songlistInfo.current.tagId = id
    void saveSongListSetting({ tagName: name, tagId: id })
    listRef.current?.loadList(songlistInfo.current.source, songlistInfo.current.sortId, id)
  }

  return (
    <View style={styles.container}>
      <HeaderBar
        ref={headerBarRef}
        onTagChange={handleTagChange}
      />
      <List ref={listRef} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
})