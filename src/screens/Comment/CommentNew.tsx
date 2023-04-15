import React, { useEffect, useRef } from 'react'
import { filterList, getNewComment } from './utils'
import music from '@/utils/musicSdk'
import List, { type ListType } from './components/List'
const limit = 15
const defaultCommentInfo: LX.Comment.LastCommentInfo = { id: '' }

export default ({ musicInfo, onUpdateTotal }: {
  musicInfo: LX.Music.MusicInfoOnline
  onUpdateTotal: (total: number) => void
}) => {
  // const [isLoading, setIsLoading] = useState(false)
  const listRef = useRef<ListType>(null)
  const listInfo = useRef({ page: 1, total: 0, maxPage: 1, isEnd: false, isLoading: false, isLoadError: false, lastCommentInfo: defaultCommentInfo })
  const handleGetComment = async(musicInfo: LX.Music.MusicInfoOnline, page: number, lastCommentInfo: LX.Comment.LastCommentInfo) => {
    // setIsLoading(true)
    listInfo.current.isLoading = true
    return getNewComment(musicInfo, page, limit, lastCommentInfo).then(commentInfo => {
      listInfo.current.page = page
      listInfo.current.isLoading = false
      // setIsLoading(false)
      if (listInfo.current.isLoadError) {
        listInfo.current.isLoadError = false
      }
      return commentInfo
    }).catch(async err => {
      console.log(err)
      if (err.message != '取消请求') {
        listInfo.current.isLoading = false
        // setIsLoading(false)
        listInfo.current.isLoadError = true
      }
      throw err
    })
  }

  const updateStatus = () => {
    if (listInfo.current.isLoadError) {
      listRef.current?.setStatus('error')
    } else if (listInfo.current.isEnd) {
      listRef.current?.setStatus('end')
    } else if (!listInfo.current.isLoading) {
      listRef.current?.setStatus('idle')
    }
  }

  const updateLastCommentInfo = (lastCommentInfo: LX.Comment.LastCommentInfo) => {
    if (!lastCommentInfo) {
      listInfo.current.lastCommentInfo = lastCommentInfo
    } else {
      listInfo.current.lastCommentInfo = defaultCommentInfo
    }
  }

  const handleListLoadMore = () => {
    console.log('load')
    if (listInfo.current.isLoading || listInfo.current.isEnd) return
    const list = listRef.current?.getList() ?? []
    const page = list.length ? listInfo.current.page + 1 : 1
    listRef.current?.setStatus('loading')
    let lastCommentInfo = listInfo.current.lastCommentInfo
    void handleGetComment(musicInfo, page, lastCommentInfo).then(({ comments, lastCommentInfo }) => {
      let isEnd = page >= listInfo.current.maxPage
      if (listInfo.current.isEnd != isEnd) listInfo.current.isEnd = isEnd
      updateLastCommentInfo(lastCommentInfo)
      listRef.current?.setList(filterList([...listRef.current.getList(), ...comments]))
    }).finally(updateStatus)
  }

  const handleListRefresh = () => {
    listRef.current?.setStatus('refreshing')
    void handleGetComment(musicInfo, 1, defaultCommentInfo).then(({ comments, maxPage, total, lastCommentInfo }) => {
      listInfo.current.total = total
      listInfo.current.maxPage = maxPage
      onUpdateTotal(total)
      updateLastCommentInfo(lastCommentInfo)
      let isEnd = maxPage === 1
      if (listInfo.current.isEnd != isEnd) listInfo.current.isEnd = isEnd
      listRef.current?.setList(filterList(comments))
    }).finally(updateStatus)
  }

  const handleShowComment = (musicInfo: LX.Music.MusicInfoOnline) => {
    if (!musicInfo.id || !music[musicInfo.source].comment) return
    listInfo.current.page = 1
    listInfo.current.total = 0
    listInfo.current.maxPage = 1
    listInfo.current.isEnd = false
    listInfo.current.isLoading = false
    listInfo.current.isLoadError = false
    listInfo.current.lastCommentInfo = defaultCommentInfo
    listRef.current?.setList([])
    listRef.current?.setStatus('loading')
    void handleGetComment(musicInfo, 1, defaultCommentInfo).then(({ comments, maxPage, total, lastCommentInfo }) => {
      listInfo.current.total = total
      listInfo.current.maxPage = maxPage
      onUpdateTotal(total)
      updateLastCommentInfo(lastCommentInfo)
      let isEnd = maxPage === 1
      if (listInfo.current.isEnd != isEnd) listInfo.current.isEnd = isEnd
      setTimeout(() => {
        listRef.current?.setList(filterList(comments))
        setTimeout(updateStatus, 300)
      }, 300)
    })
  }

  useEffect(() => {
    handleShowComment(musicInfo)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicInfo.id])


  return (
    <List
      ref={listRef}
      onLoadMore={handleListLoadMore}
      onRefresh={handleListRefresh}
    />
  )
}
