import { temporaryDirectoryPath, readDir, extname } from '@/utils/fs'
import RNFS from 'react-native-fs'
import { readPic as _readPic } from 'react-native-local-media-metadata'
export {
  type MusicMetadata,
  type MusicMetadataFull,
  readMetadata,
  writeMetadata,
  writePic,
  readLyric,
  writeLyric,
} from 'react-native-local-media-metadata'

let clearPicCacheTask: Promise<unknown> | null = null
const picCachePath = temporaryDirectoryPath + '/local-media-metadata'

const audioExt = ['mp3', 'flac', 'ogg', 'wav', 'm4a', 'aac', 'wma', 'opus', 'ape', 'mka']

export const scanAudioFiles = async(dirPath: string) => {
  const files = await readDir(dirPath)
  return files.filter(file => {
    if (file.mimeType?.startsWith('audio/')) return true
    if (audioExt.includes(extname(file?.name ?? ''))) return true
    return false
  }).map(file => file)
}

const clearPicCache = async() => {
  if (clearPicCacheTask) return clearPicCacheTask
  // 逐个删除文件，避免目录整体删除失败导致旧封面残留
  clearPicCacheTask = (async() => {
    try {
      const names = await RNFS.readdir(picCachePath)
      await Promise.all(names.map(async name => RNFS.unlink(`${picCachePath}/${name}`).catch(() => {})))
    } catch {}
  })()
  return clearPicCacheTask
}

export const readPic = async(dirPath: string): Promise<string> => {
  await clearPicCache()
  return _readPic(dirPath, picCachePath)
}

const musicPicCache = new Map<string, Promise<string>>()
/**
 * 获取歌曲内嵌封面。
 * 同一文件只解析一次，结果在当前运行期间复用，避免列表反复滚动时重复读取音频文件。
 */
export const getLocalMusicPic = async(filePath: string): Promise<string> => {
  let promise = musicPicCache.get(filePath)
  if (!promise) {
    promise = readPic(filePath).catch(() => '')
    musicPicCache.set(filePath, promise)
  }
  return promise
}

// export interface MusicMetadata {
//   type: 'mp3' | 'flac' | 'ogg' | 'wav'
//   bitrate: string
//   interval: number
//   size: number
//   ext: 'mp3' | 'flac' | 'ogg' | 'wav'
//   albumName: string
//   singer: string
//   name: string
// }
// export const readMetadata = async(filePath: string): Promise<MusicMetadata | null> => {
//   return LocalMediaModule.readMetadata(filePath)
// }

// export const readPic = async(filePath: string): Promise<string> => {
//   return LocalMediaModule.readPic(filePath)
// }

// export const readLyric = async(filePath: string): Promise<string> => {
//   return LocalMediaModule.readLyric(filePath)
// }


