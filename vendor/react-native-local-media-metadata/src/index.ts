/**
 * react-native-local-media-metadata —— 鸿蒙移植本地 stub
 *
 * 本期（HarmonyOS MVP：自定义音源 + 搜索 + 播放）不做「本地音乐」功能，
 * 本地媒体元数据读取/写入整块不实现。此 stub 提供与原 fork 相同的导出面，
 * 全部安全降级（不抛异常、不崩 bundle），让引用它的 src 代码在不触达本地
 * 媒体路径时正常运行；真走到本地媒体功能时得到空结果而非崩溃。
 *
 * 后续若要补「本地音乐」，用鸿蒙 @kit.MediaKit 的 AVMetadataExtractor 实现，
 * 替换本 stub 即可。原实现 sha: 1b5be310d112afce0df598d3e9c7521c3311049c
 */

export interface MusicMetadata {
  albumName: string
  singer: string
  name: string
}

export interface MusicMetadataFull {
  type: 'mp3' | 'flac' | 'ogg' | 'wav'
  bitrate: string
  interval: number
  size: number
  ext: 'mp3' | 'flac' | 'ogg' | 'wav'
  albumName: string
  singer: string
  name: string
}

/** 读元数据：本期不做 → 返回 null（无元数据） */
export const readMetadata = async(_filePath: string): Promise<MusicMetadataFull | null> => {
  return null
}

/** 写元数据：本期不做 → no-op */
export const writeMetadata = async(_filePath: string, _metadata: MusicMetadata, _isOverwrite = false): Promise<void> => {
}

/** 读内嵌封面：本期不做 → 返回空路径 */
export const readPic = async(_filePath: string, _picDir: string): Promise<string> => {
  return ''
}

/** 写内嵌封面：本期不做 → no-op */
export const writePic = async(_filePath: string, _picPath: string): Promise<void> => {
}

/** 读内嵌歌词：本期不做 → 返回空字符串 */
export const readLyric = async(_filePath: string, _isReadLrcFile = true): Promise<string> => {
  return ''
}

/** 写内嵌歌词：本期不做 → no-op */
export const writeLyric = async(_filePath: string, _lyric: string): Promise<void> => {
}
