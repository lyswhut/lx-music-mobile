import { NativeModules } from 'react-native'

const { LyricModule } = NativeModules

export interface SuperLyricInfo {
  id: string
  title: string
  artist: string
  album: string
  duration: number
}

/**
 * 检查 SuperLyric 服务是否可用
 */
export const isAvailable = async(): Promise<boolean> => {
  return LyricModule.isSuperLyricAvailable()
}

/**
 * 启用/关闭歌词发布
 * @param enabled 是否启用
 * @returns 服务是否可用
 */
export const setEnabled = async(enabled: boolean): Promise<boolean> => {
  return LyricModule.setSuperLyricEnabled(enabled)
}

/**
 * 发布当前歌曲歌词
 * @param lyric 主歌词
 * @param translation 翻译歌词
 * @param romaLyric 罗马音歌词
 * @param info 歌曲信息
 */
export const setLyric = async(lyric: string, translation: string, romaLyric: string, info: SuperLyricInfo): Promise<void> => {
  return LyricModule.setSuperLyric(lyric, translation, romaLyric, info)
}

/**
 * 清除已发布的歌词
 */
export const clear = async(): Promise<void> => {
  return LyricModule.clearSuperLyric()
}
