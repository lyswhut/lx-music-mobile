
import { saveLyric, saveMusicUrl } from '@/utils/data'
import { updateListMusics } from '@/core/list'
import {
  buildLyricInfo,
  getCachedLyricInfo,
  getOnlineOtherSourceLyricByLocal,
  getOnlineOtherSourceLyricInfo,
  getOnlineOtherSourceMusicUrl,
  getOnlineOtherSourceMusicUrlByLocal,
  getOnlineOtherSourcePicByLocal,
  getOnlineOtherSourcePicUrl,
  getOtherSource,
} from './utils'
import { getLocalFilePath } from '@/utils/music'
import { readLyric, readPic } from '@/utils/localMediaMetadata'
import { stat } from '@/utils/fs'

const getOtherSourceByLocal = async(musicInfo: LX.Music.MusicInfoLocal) => {
  let result: LX.Music.MusicInfoOnline[] = []
  result = await getOtherSource(musicInfo)
  if (result.length) return result
  if (musicInfo.name.includes('-')) {
    const [name, singer] = musicInfo.name.split('-').map(val => val.trim())
    result = await getOtherSource({
      ...musicInfo,
      name,
      singer,
    })
    if (result.length) return result
    result = await getOtherSource({
      ...musicInfo,
      name: singer,
      singer: name,
    })
    if (result.length) return result
  }
  let fileName = (await stat(musicInfo.meta.filePath).catch(() => ({ name: null }))).name ?? musicInfo.meta.filePath.split('/').at(-1)
  if (fileName) {
    fileName = fileName.substring(0, fileName.lastIndexOf('.'))
    if (fileName != musicInfo.name) {
      if (fileName.includes('-')) {
        const [name, singer] = fileName.split('-').map(val => val.trim())
        result = await getOtherSource({
          ...musicInfo,
          name,
          singer,
        })
        if (result.length) return result
        result = await getOtherSource({
          ...musicInfo,
          name: singer,
          singer: name,
        })
      } else {
        result = await getOtherSource({
          ...musicInfo,
          name: fileName,
          singer: '',
        })
      }
      if (result.length) return result
    }
  }

  return result
}

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

  try {
    return await getOnlineOtherSourceMusicUrlByLocal(musicInfo, isRefresh).then(({ url, quality, isFromCache }) => {
      if (!isFromCache) void saveMusicUrl(musicInfo, quality, url)
      return url
    })
  } catch {}

  onToggleSource()
  const otherSource = await getOtherSourceByLocal(musicInfo)
  if (!otherSource.length) throw new Error('source not found')
  return getOnlineOtherSourceMusicUrl({ musicInfos: [...otherSource], onToggleSource, isRefresh }).then(({ url, quality: targetQuality, musicInfo: targetMusicInfo, isFromCache }) => {
    // saveLyric(musicInfo, data.lyricInfo)
    if (!isFromCache) void saveMusicUrl(targetMusicInfo, targetQuality, url)

    // TODO: save url ?
    return url
  })
}

export const getPicUrl = async({ musicInfo, listId, isRefresh, skipFilePic, onToggleSource = () => {} }: {
  musicInfo: LX.Music.MusicInfoLocal
  listId?: string | null
  isRefresh: boolean
  skipFilePic?: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<string> => {
  if (!isRefresh && !skipFilePic) {
    let pic = await readPic(musicInfo.meta.filePath).catch(() => null)
    if (pic) {
      if (pic.startsWith('/')) pic = `file://${pic}`
      return pic
    }

    if (musicInfo.meta.picUrl) return musicInfo.meta.picUrl
  }

  try {
    return await getOnlineOtherSourcePicByLocal(musicInfo).then(({ url }) => {
      return url
    })
  } catch {}

  onToggleSource()
  const otherSource = await getOtherSourceByLocal(musicInfo)
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
  const lyric = await readLyric(filePath).catch(() => null)
  if (!lyric) return null
  return {
    lyric,
  }
}
export const getLyricInfo = async({ musicInfo, isRefresh, skipFileLyric, onToggleSource = () => {} }: {
  musicInfo: LX.Music.MusicInfoLocal
  skipFileLyric?: boolean
  isRefresh: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<LX.Player.LyricInfo> => {
  if (!isRefresh && !skipFileLyric) {
    // const lyricInfo = await getCachedLyricInfo(musicInfo)
    // if (lyricInfo?.rawlrcInfo.lyric && lyricInfo.lyric != lyricInfo.rawlrcInfo.lyric) {
    //   // 存在已编辑歌词
    //   return buildLyricInfo(lyricInfo)
    // }

    // 尝试读取文件内歌词
    const rawlrcInfo = await getMusicFileLyric(musicInfo.meta.filePath)
    if (rawlrcInfo) return buildLyricInfo(rawlrcInfo)

    const lyricInfo = await getCachedLyricInfo(musicInfo)
    if (lyricInfo?.lyric) return buildLyricInfo(lyricInfo)
  }

  try {
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    return await getOnlineOtherSourceLyricByLocal(musicInfo, isRefresh).then(({ lyricInfo, isFromCache }) => {
      if (!isFromCache) void saveLyric(musicInfo, lyricInfo)
      return buildLyricInfo(lyricInfo)
    })
  } catch {}

  onToggleSource()
  const otherSource = await getOtherSourceByLocal(musicInfo)
  if (!otherSource.length) throw new Error('source not found')
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  return getOnlineOtherSourceLyricInfo({ musicInfos: [...otherSource], onToggleSource, isRefresh }).then(({ lyricInfo, musicInfo: targetMusicInfo, isFromCache }) => {
    void saveLyric(musicInfo, lyricInfo)

    if (isFromCache) return buildLyricInfo(lyricInfo)
    void saveLyric(targetMusicInfo, lyricInfo)

    return buildLyricInfo(lyricInfo)
  })
}
