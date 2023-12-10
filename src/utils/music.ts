import { existsFile } from './fs'


export const getLocalFilePath = async(musicInfo: LX.Music.MusicInfoLocal): Promise<string> => {
  return (await existsFile(musicInfo.meta.filePath)) ? musicInfo.meta.filePath : ''
}
