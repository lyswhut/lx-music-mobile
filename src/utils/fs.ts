import { Platform } from 'react-native'
import RNFS from 'react-native-fs'
import {
  Dirs,
  FileSystem,
  AndroidScoped,
  type OpenDocumentOptions,
  type Encoding,
  type HashAlgorithm,
  getExternalStoragePaths as _getExternalStoragePaths,
} from 'react-native-file-system'

export type {
  FileType,
} from 'react-native-file-system'

// export const externalDirectoryPath = RNFS.ExternalDirectoryPath

export const extname = (name: string) => name.lastIndexOf('.') > 0 ? name.substring(name.lastIndexOf('.') + 1) : ''

export const temporaryDirectoryPath = Dirs.CacheDir
export const externalStorageDirectoryPath = Dirs.SDCardDir
export const privateStorageDirectoryPath = Dirs.DocumentDir

/** 下载目录下统一子文件夹名，便于用户识别并与其它下载区分 */
const MUSIC_DOWNLOAD_APP_FOLDER = 'lxmusic'

/**
 * 获取歌曲下载保存目录绝对路径。
 * Android（APK）：系统公共 Download 下的 `lxmusic` 子目录，用户可在文件管理器「下载/lxmusic」中看到。
 * iOS：无与用户共享的公共 Download，使用应用沙盒 `Documents/download/lxmusic`。
 */
export const getMusicDownloadDirectoryPath = (): string => {
  if (Platform.OS === 'android') {
    const root = (RNFS.DownloadDirectoryPath ?? '').replace(/\/+$/, '')
    if (root.length > 0) {
      return `${root}/${MUSIC_DOWNLOAD_APP_FOLDER}`.replace(/\/+/g, '/')
    }
  }
  return `${privateStorageDirectoryPath}/download/${MUSIC_DOWNLOAD_APP_FOLDER}`.replace(/\/+/g, '/')
}

/**
 * 确保下载目录存在（与 RNFS.downloadFile 使用同一套路径 API）。
 * Android 公共路径下需单独创建 `lxmusic` 子目录。
 */
export const ensureMusicDownloadDirectory = async(): Promise<string> => {
  const dir = getMusicDownloadDirectoryPath()
  if (!(await RNFS.exists(dir))) {
    await RNFS.mkdir(dir)
  }
  return dir
}

/**
 * 判断下载目标路径是否已存在（用于生成不重复文件名）。
 */
export const existsMusicDownloadTarget = async(path: string): Promise<boolean> => {
  return RNFS.exists(path)
}

export interface MusicDownloadDirItem {
  name: string
  path: string
  isFile: boolean
  size: number
}

/**
 * 列出下载目录内文件（Android 公共目录用 RNFS.readDir，与写入路径一致）。
 */
export const readMusicDownloadDirectory = async(): Promise<MusicDownloadDirItem[]> => {
  const dir = getMusicDownloadDirectoryPath()
  if (Platform.OS === 'android') {
    const list = await RNFS.readDir(dir)
    return list.map(item => ({
      name: item.name,
      path: item.path,
      isFile: item.isFile(),
      size: typeof item.size === 'number' ? item.size : Number(item.size) || 0,
    }))
  }
  const list = await FileSystem.ls(dir)
  return list.map((item: {
    name: string
    path: string
    isFile?: boolean
    isDirectory?: boolean
    size?: number
  }) => ({
    name: item.name,
    path: item.path,
    isFile: item.isFile === true || item.isDirectory === false,
    size: item.size ?? 0,
  }))
}

/**
 * 通知系统媒体库扫描新文件（Android 下载后便于「音乐/文件」类应用立刻可见）。
 */
export const scanMusicDownloadFile = async(path: string): Promise<void> => {
  if (Platform.OS !== 'android') return
  try {
    await RNFS.scanFile(path)
  } catch {
    // 扫描失败不影响下载已成功写入磁盘
  }
}

export const getExternalStoragePaths = async(is_removable?: boolean) => _getExternalStoragePaths(is_removable)

export const selectManagedFolder = async(isPersist: boolean = false) => AndroidScoped.openDocumentTree(isPersist)
export const selectFile = async(options: OpenDocumentOptions) => AndroidScoped.openDocument(options)
export const removeManagedFolder = async(path: string) => AndroidScoped.releasePersistableUriPermission(path)
export const getManagedFolders = async() => AndroidScoped.getPersistedUriPermissions()

export const getPersistedUriList = async() => AndroidScoped.getPersistedUriPermissions()


export const readDir = async(path: string) => FileSystem.ls(path)

export const unlink = async(path: string) => FileSystem.unlink(path)

export const mkdir = async(path: string) => FileSystem.mkdir(path)

export const stat = async(path: string) => FileSystem.stat(path)
export const hash = async(path: string, algorithm: HashAlgorithm) => FileSystem.hash(path, algorithm)

export const readFile = async(path: string, encoding?: Encoding) => FileSystem.readFile(path, encoding)


// export const copyFile = async(fromPath: string, toPath: string) => FileSystem.cp(fromPath, toPath)

export const moveFile = async(fromPath: string, toPath: string) => FileSystem.mv(fromPath, toPath)
export const gzipFile = async(fromPath: string, toPath: string) => FileSystem.gzipFile(fromPath, toPath)
export const unGzipFile = async(fromPath: string, toPath: string) => FileSystem.unGzipFile(fromPath, toPath)
export const gzipString = async(data: string, encoding?: Encoding) => FileSystem.gzipString(data, encoding)
export const unGzipString = async(data: string, encoding?: Encoding) => FileSystem.unGzipString(data, encoding)

export const existsFile = async(path: string) => FileSystem.exists(path)

export const rename = async(path: string, name: string) => FileSystem.rename(path, name)

export const writeFile = async(path: string, data: string, encoding?: Encoding) => FileSystem.writeFile(path, data, encoding)

export const appendFile = async(path: string, data: string, encoding?: Encoding) => FileSystem.appendFile(path, data, encoding)

export const downloadFile = (url: string, path: string, options: Omit<RNFS.DownloadFileOptions, 'fromUrl' | 'toFile'> = {}) => {
  if (!options.headers) {
    options.headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Mobile Safari/537.36',
    }
  }
  return RNFS.downloadFile({
    fromUrl: url, // URL to download file from
    toFile: path, // Local filesystem path to save the file to
    ...options,
    // headers: options.headers, // An object of headers to be passed to the server
    // // background?: boolean;     // Continue the download in the background after the app terminates (iOS only)
    // // discretionary?: boolean;  // Allow the OS to control the timing and speed of the download to improve perceived performance  (iOS only)
    // // cacheable?: boolean;      // Whether the download can be stored in the shared NSURLCache (iOS only, defaults to true)
    // progressInterval: options.progressInterval,
    // progressDivider: options.progressDivider,
    // begin: (res: DownloadBeginCallbackResult) => void;
    // progress?: (res: DownloadProgressCallbackResult) => void;
    // // resumable?: () => void;    // only supported on iOS yet
    // connectionTimeout?: number // only supported on Android yet
    // readTimeout?: number       // supported on Android and iOS
    // // backgroundTimeout?: number // Maximum time (in milliseconds) to download an entire resource (iOS only, useful for timing out background downloads)
  })
}

export const stopDownload = (jobId: number) => {
  RNFS.stopDownload(jobId)
}
