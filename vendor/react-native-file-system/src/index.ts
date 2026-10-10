import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-file-system' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const FileSystemModule = NativeModules.FileSystemModule
  ? NativeModules.FileSystemModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );


export interface FileType {
  /** Document Tree Uri for the file or directory */
  // uri: string
  /** Name of the file or directory */
  name: string
  /** Storage path for the file */
  path: string
  isDirectory: boolean
  isFile: boolean
  /** Last modified date of the file or directory */
  lastModified: number
  canRead: boolean
  /** data read from the file */
  data: string
  /** mime type of the file */
  mimeType: string
  size: number
}
export type Encoding = 'base64' | 'utf8'
export type HashAlgorithm = 'md5' | 'sha1' | 'sha224' | 'sha256' | 'sha384' | 'sha512'

export const Dirs: {
  /**
   * Temporary files. System/user may delete these if device storage is low.
   */
  CacheDir: string

  /**
   * System recommended location for SQLite files.
   *
   * Android only.
   */
  DatabaseDir?: string

  /**
   * Persistent data. Generally user created content.
   */
  DocumentDir: string

  /**
   * App's default root directory.
   */
  MainBundleDir: string

  /**
   * Root path to removable media. Prefer `cpExternal()` when possible, as
   * Android discourages this access method.
   *
   * Android only.
   */
  SDCardDir: string
} = FileSystemModule.getConstants()

export interface OpenDocumentOptions {
  mimeTypes?: string[]
  extTypes?: string[]
  multi?: boolean
  toPath?: string
  encoding?: Encoding
}

export const getExternalStoragePaths = async(is_removable?: boolean): Promise<string[]> => {
  return is_removable == null
    ? FileSystemModule.getAllExternalStoragePaths()
    : FileSystemModule.getExternalStoragePaths(is_removable)
}

export const AndroidScoped = {
  async getPersistedUriPermissions(): Promise<string[]> {
    return FileSystemModule.getPersistedUriPermissions()
  },
  releasePersistableUriPermission(path: string) {
    return FileSystemModule.releasePersistableUriPermission(path)
  },
  async openDocumentTree(isPersist: boolean): Promise<FileType> {
    return FileSystemModule.openDocumentTree(isPersist)
  },
  async openDocument(options: OpenDocumentOptions): Promise<FileType> {
    return FileSystemModule.openDocument(options)
  },
}

export const FileSystem = {
  /**
   * Copy a file.
   */
  async cp(source: string, target: string): Promise<void> {
    return FileSystemModule.cp(source, target)
  },

  /**
   * Check if a path exists.
   */
  async exists(path: string): Promise<boolean> {
    return FileSystemModule.exists(path)
  },

  /**
   * List files in a directory.
   */
  async ls(path: string): Promise<FileType[]> {
    return FileSystemModule.ls(path)
  },

  /**
   * Make a new directory.
   *
   * Returns path of the created directory.
   */
  async mkdir(path: string): Promise<FileType> {
    return FileSystemModule.mkdir(path)
  },

  /**
   * move a file.
   */
  async mv(source: string, target: string): Promise<boolean> {
    return FileSystemModule.mv(source, target)
  },

  /**
   * rename a file.
   */
  async rename(source: string, name: string): Promise<boolean> {
    return FileSystemModule.rename(source, name)
  },

  /**
   * Read the content of a file.
   */
  async readFile(path: string, encoding: Encoding = 'utf8'): Promise<string> {
    return FileSystemModule.readFile(path, encoding)
  },

  /**
   * Read file metadata.
   */
  async stat(path: string): Promise<FileType> {
    return FileSystemModule.stat(path)
  },

  /**
   * Delete a file.
   */
  async unlink(path: string): Promise<boolean> {
    return FileSystemModule.unlink(path)
  },

  /**
   * Write content to a file.
   *
   * Default encoding of `data` is assumed utf8.
   */
  async writeFile(path: string, data: string, encoding: Encoding = 'utf8'): Promise<void> {
    return FileSystemModule.writeFile(path, data, encoding)
  },
  /**
   * Append content to a file.
   *
   * Default encoding of `data` is assumed utf8.
   */
  async appendFile(path: string, data: string, encoding: Encoding = 'utf8'): Promise<void> {
    return FileSystemModule.appendFile(path, data, encoding)
  },
  /**
   * Gzip to a file.
   */
  async gzipFile(source: string, target: string): Promise<void> {
    return FileSystemModule.gzipFile(source, target)
  },
  /**
   * UnGzip to a file.
   */
  async unGzipFile(source: string, target: string): Promise<void> {
    return FileSystemModule.unGzipFile(source, target)
  },
  /**
   * Gzip string.
   *
   * Default encoding of `data` is assumed utf8.
   */
  async gzipString(data: string, encoding: Encoding = 'utf8'): Promise<string> {
    return FileSystemModule.gzipString(data, encoding)
  },
  /**
   * UnGzip string.
   *
   * Default encoding of `data` is assumed utf8.
   */
  async unGzipString(data: string, encoding: Encoding = 'utf8'): Promise<string> {
    return FileSystemModule.unGzipString(data, encoding)
  },
  /**
   * Get File hash string.
   *
   * Default algorithm is md5.
   */
  async hash(path: string, algorithm: HashAlgorithm = 'md5'): Promise<string> {
    return FileSystemModule.hash(path, algorithm)
  },
}
