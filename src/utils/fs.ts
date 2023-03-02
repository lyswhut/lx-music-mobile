import RNFS from 'react-native-fs'

export const externalDirectoryPath = RNFS.ExternalDirectoryPath

export const temporaryDirectoryPath = RNFS.TemporaryDirectoryPath
export const externalStorageDirectoryPath = RNFS.ExternalStorageDirectoryPath

export const unlink = async(path: string) => RNFS.unlink(path)

export const readDir = async(path: string) => RNFS.readDir(path)

export const mkdir = async(path: string) => RNFS.mkdir(path)

export const stat = async(path: string) => RNFS.stat(path)

// export const readFile = async(path: string, encoding = 'utf8') => RNFS.readFile(path, encoding)

export const copyFile = async(fromPath: string, toPath: string) => RNFS.copyFile(fromPath, toPath)

export const moveFile = async(fromPath: string, toPath: string) => RNFS.moveFile(fromPath, toPath)

export const existsFile = async(path: string) => RNFS.exists(path)

// export const writeFile = async(path: string, data: string, encoding = 'utf8') => RNFS.writeFile(path, data, encoding)

export const appendFile = async(path: string, data: string, encoding = 'utf8') => RNFS.appendFile(path, data, encoding)

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
