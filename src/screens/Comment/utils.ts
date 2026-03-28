import { toOldMusicInfo } from '@/utils'
import music from '@/utils/musicSdk'

export interface Comment {
  id: string
  text: string
  images?: string[]
  location?: string
  timeStr?: string
  userName: string
  avatar?: string
  userId?: string
  likedCount?: number
  replyNum?: number
  reply: Comment[]
}
export interface CommentInfo {
  source: LX.OnlineSource
  comments: Comment[]
  total: number
  page: number
  limit: number
  maxPage: number
}

export const getNewComment = async(musicInfo: LX.Music.MusicInfoOnline, page: number, limit: number, retryNum = 0): Promise<CommentInfo> => {
  let resp
  try {
    resp = await (music[musicInfo.source].comment.getComment(toOldMusicInfo(musicInfo), page, limit) as Promise<CommentInfo>)
  } catch (error: any) {
    console.log(error.message)
    if (error.message == '取消请求' || ++retryNum > 2) throw error
    resp = await getNewComment(musicInfo, page, limit, retryNum)
  }
  return resp
}

export const getHotComment = async(musicInfo: LX.Music.MusicInfoOnline, page: number, limit: number, retryNum = 0): Promise<CommentInfo> => {
  let resp
  try {
    resp = await (music[musicInfo.source].comment.getHotComment(toOldMusicInfo(musicInfo), page, limit) as Promise<CommentInfo>)
  } catch (error: any) {
    console.log(error.message)
    if (error.message == '取消请求' || ++retryNum > 2) throw error
    resp = await getHotComment(musicInfo, page, limit, retryNum)
  }
  return resp
}

export const filterList = (list: Comment[]) => {
  const set = new Set()
  return list.filter(c => {
    let id = String(c.id)
    if (set.has(id)) return false
    set.add(id)
    return true
  })
}
