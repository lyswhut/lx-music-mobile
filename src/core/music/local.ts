
import { saveLyric, saveMusicUrl } from '@/utils/data'
import { updateListMusics } from '@/core/list'
import {
  buildLyricInfo,
  getCachedLyricInfo,
  getOnlineOtherSourceLyricInfo,
  getOnlineOtherSourceMusicUrl,
  getOnlineOtherSourcePicUrl,
  getOtherSource,
} from './utils'
import { getLocalFilePath } from '@/utils/music'
import { readLyric, readPic } from '@/utils/nativeModules/locaMedia'


export const getMusicUrl = async({ musicInfo, isRefresh, onToggleSource = () => {} }: {
  musicInfo: LX.Music.MusicInfoLocal
  isRefresh: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<string> => {
  if (!isRefresh) {
    const path = await getLocalFilePath(musicInfo)
    // console.log(path)
    if (path) return path
  }
  onToggleSource()
  const otherSource = await getOtherSource(musicInfo)
  if (!otherSource.length) throw new Error('source not found')
  return getOnlineOtherSourceMusicUrl({ musicInfos: [...otherSource], onToggleSource, isRefresh }).then(({ url, quality: targetQuality, musicInfo: targetMusicInfo, isFromCache }) => {
    // saveLyric(musicInfo, data.lyricInfo)
    if (!isFromCache) void saveMusicUrl(targetMusicInfo, targetQuality, url)

    // TODO: save url ?
    return url
  })
}

export const getPicUrl = async({ musicInfo, listId, isRefresh, onToggleSource = () => {} }: {
  musicInfo: LX.Music.MusicInfoLocal
  listId?: string | null
  isRefresh: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<string> => {
  if (!isRefresh) {
    const pic = await readPic(musicInfo.meta.filePath)
    if (pic) return pic

    if (musicInfo.meta.picUrl) return musicInfo.meta.picUrl
  }

  onToggleSource()
  const otherSource = await getOtherSource(musicInfo)
  if (!otherSource.length) throw new Error('source not found')
  return getOnlineOtherSourcePicUrl({ musicInfos: [...otherSource], onToggleSource, isRefresh }).then(({ url, musicInfo: targetMusicInfo, isFromCache }) => {
    if (listId) {
      musicInfo.meta.picUrl = url
      void updateListMusics([{ id: listId, musicInfo }])
    }

    return url
  })
}

const getMusicFileLyric = async(filePath: string) => {
  const lyric = await readLyric(filePath)
  if (!lyric) return null
  return {
    lyric,
  }
}
export const getLyricInfo = async({ musicInfo, isRefresh, onToggleSource = () => {} }: {
  musicInfo: LX.Music.MusicInfoLocal
  isRefresh: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<LX.Player.LyricInfo> => {
  if (!isRefresh) {
    const lyricInfo = await getCachedLyricInfo(musicInfo)
    if (lyricInfo) {
      // 存在已编辑、原始歌词
      if (lyricInfo.rawlrcInfo.lyric) return buildLyricInfo(lyricInfo)
    }

    // 尝试读取文件内歌词
    const rawlrcInfo = await getMusicFileLyric(musicInfo.meta.filePath)
    if (rawlrcInfo) return buildLyricInfo(lyricInfo ? { ...lyricInfo, rawlrcInfo } : rawlrcInfo)
  }

  onToggleSource()
  const otherSource = await getOtherSource(musicInfo)
  if (!otherSource.length) throw new Error('source not found')
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  return getOnlineOtherSourceLyricInfo({ musicInfos: [...otherSource], onToggleSource, isRefresh }).then(({ lyricInfo, musicInfo: targetMusicInfo, isFromCache }) => {
    void saveLyric(musicInfo, lyricInfo)

    if (isFromCache) return buildLyricInfo(lyricInfo)
    void saveLyric(targetMusicInfo, lyricInfo)

    return buildLyricInfo(lyricInfo)
  })
}
