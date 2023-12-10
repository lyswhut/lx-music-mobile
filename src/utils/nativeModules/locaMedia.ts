import { NativeModules } from 'react-native'

const { LocalMediaModule } = NativeModules

export const scanAudioFiles = async(dirPath: string): Promise<string[]> => {
  return LocalMediaModule.scanAudioFiles(dirPath)
}

export interface MusicMetadata {
  type: 'mp3' | 'flac' | 'ogg' | 'wav'
  bitrate: string
  interval: number
  size: number
  ext: 'mp3' | 'flac' | 'ogg' | 'wav'
  albumName: string
  singer: string
  name: string
}
export const readMetadata = async(filePath: string): Promise<MusicMetadata | null> => {
  return LocalMediaModule.readMetadata(filePath)
}

export const readPic = async(filePath: string): Promise<string> => {
  return LocalMediaModule.readPic(filePath)
}

export const readLyric = async(filePath: string): Promise<string> => {
  return LocalMediaModule.readLyric(filePath)
}

