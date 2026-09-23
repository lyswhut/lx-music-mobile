import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

import { search } from '@/core/search/songlist'
import Songlist, { type SonglistProps, type SonglistType } from '@/screens/Home/Views/SongList/components/Songlist'
import searchSonglistState, { type Source } from '@/store/search/songlist/state'

// export type MusicListProps = Pick<OnlineListProps,
// 'onLoadMore'
// | 'onPlayList'
// | 'onRefresh'
// >

export interface MusicListType {
  loadList: (text: string, source: Source) => void
}

export default forwardRef<MusicListType, {}>((props, ref) => {
  const listRef = useRef<SonglistType>(null)
  const searchInfoRef = useRef<{ text: string, source: Source }>({ text: '', source: 'kw' })
  const isUnmountedRef = useRef(false)
  useImperativeHandle(ref, () => ({
    async loadList(text, source) {
      // 和 MusicList 一样：翻页/刷新读的是这个 ref，必须在两个分支之前赋值。
      // 切歌单/歌曲标签会重挂本组件，不加这一句的话，"直接用已缓存结果"的分支
      // 会让 ref 停在初始的 {text:'', source:'kw'}，翻页就变成请求一个空关键词。
      searchInfoRef.current.text = text
      searchInfoRef.current.source = source
      // const listDetailInfo = searchSonglistState.listDetailInfo
      listRef.current?.setList([], source == 'all')
      if (searchSonglistState.searchText == text && searchSonglistState.source == source && searchSonglistState.listInfos[searchSonglistState.source]!.list.length) {
        requestAnimationFrame(() => {
          listRef.current?.setList(searchSonglistState.listInfos[searchSonglistState.source]!.list, source == 'all')
        })
      } else {
        listRef.current?.setStatus('loading')
        const page = 1
        return search(text, page, source).then((list) => {
          // null 表示这次结果已被更新的请求顶掉，列表归那次请求管
          if (list == null || isUnmountedRef.current) return
          requestAnimationFrame(() => {
            listRef.current?.setList(list, source == 'all')
            listRef.current?.setStatus(searchSonglistState.maxPages[searchSonglistState.source] == page ? 'end' : 'idle')
          })
        }).catch(() => {
          listRef.current?.setStatus('error')
        })
      }
    },
  }), [])

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])


  const handleRefresh: SonglistProps['onRefresh'] = () => {
    const page = 1
    listRef.current?.setStatus('refreshing')
    search(searchInfoRef.current.text, page, searchInfoRef.current.source).then((list) => {
      // null：结果作废，列表归发起更新的那次请求管
      if (list == null || isUnmountedRef.current) return
      listRef.current?.setList(list, searchInfoRef.current.source == 'all')
      listRef.current?.setStatus(searchSonglistState.maxPages[searchSonglistState.source] == page ? 'end' : 'idle')
    }).catch(() => {
      listRef.current?.setStatus('error')
    })
  }
  const handleLoadMore: SonglistProps['onLoadMore'] = () => {
    listRef.current?.setStatus('loading')
    const info = searchSonglistState.listInfos[searchInfoRef.current.source]!
    const page = info.list.length ? info.page + 1 : 1
    search(searchInfoRef.current.text, page, searchInfoRef.current.source).then((list) => {
      // 同上：拿不到有效结果就别动列表
      if (list == null || isUnmountedRef.current) return
      listRef.current?.setList(list, searchInfoRef.current.source == 'all')
      listRef.current?.setStatus(searchSonglistState.maxPages[searchSonglistState.source] == page ? 'end' : 'idle')
    }).catch(() => {
      listRef.current?.setStatus('error')
    })
  }

  return <Songlist
    ref={listRef}
    onRefresh={handleRefresh}
    onLoadMore={handleLoadMore}
  />
})

