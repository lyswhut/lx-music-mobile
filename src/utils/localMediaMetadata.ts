import { temporaryDirectoryPath } from '@/utils/fs'
import { scanFiles, readPic as _readPic } from 'react-native-local-media-metadata'
import { unlink } from './nativeModules/utils'
export {
  type MusicMetadata,
  type MusicMetadataFull,
  readMetadata,
  writeMetadata,
  writePic,
  readLyric,
  writeLyric,
} from 'react-native-local-media-metadata'

let cleared = false
const picCachePath = temporaryDirectoryPath + '/local-media-metadata'

export const scanAudioFiles = async(dirPath: string): Promise<string[]> => {
  return scanFiles(dirPath, ['mp3', 'flac', 'ogg', 'wav'])
}

const clearPicCache = async() => {
  await unlink(picCachePath)
  cleared = true
}

export const readPic = async(dirPath: string): Promise<string> => {
  if (!cleared) await clearPicCache()
  return _readPic(dirPath, picCachePath)
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


