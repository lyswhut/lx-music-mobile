import { scanFiles } from 'react-native-local-media-metadata'
export { type MusicMetadata, readMetadata, readPic, readLyric } from 'react-native-local-media-metadata'

export const scanAudioFiles = async(dirPath: string): Promise<string[]> => {
  return scanFiles(dirPath, ['mp3', 'flac', 'ogg', 'wav'])
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


