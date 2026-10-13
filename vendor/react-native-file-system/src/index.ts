/**
 * react-native-file-system —— HarmonyOS 适配实现（委托 react-native-fs OH 版）。
 *
 * 原 fork(github:lyswhut/react-native-file-system)依赖安卓原生 FileSystemModule，
 * 鸿蒙无此原生模块,模块顶层 `Dirs = FileSystemModule.getConstants()` 会直接抛
 * "doesn't seem to be linked"。此处改为用 react-native-fs(OH 移植版,原生已注册)
 * 实现等价文件操作;gzip 用 pako(已是项目依赖)。
 *
 * AndroidScoped.openDocument 使用鸿蒙系统文件选择器;文档树和外部存储枚举仍为桩。
 */
import RNFS from 'react-native-fs'
import pako from 'pako'
import { Buffer } from '@craftzdog/react-native-buffer'
import { TurboModuleRegistry, type TurboModule } from 'react-native'

export interface FileType {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
  lastModified: number
  canRead: boolean
  data: string
  mimeType: string
  size: number
}
export type Encoding = 'base64' | 'utf8'
export type HashAlgorithm = 'md5' | 'sha1' | 'sha224' | 'sha256' | 'sha384' | 'sha512'

const toFileType = (item: any): FileType => ({
  name: item.name,
  path: item.path,
  isDirectory: typeof item.isDirectory === 'function' ? item.isDirectory() : !!item.isDirectory,
  isFile: typeof item.isFile === 'function' ? item.isFile() : !!item.isFile,
  lastModified: item.mtime ? new Date(item.mtime).getTime() : 0,
  canRead: true,
  data: '',
  mimeType: '',
  size: Number(item.size) || 0,
})

export const Dirs: {
  CacheDir: string
  DatabaseDir?: string
  DocumentDir: string
  MainBundleDir: string
  SDCardDir: string
} = {
  CacheDir: RNFS.CachesDirectoryPath,
  DatabaseDir: RNFS.DocumentDirectoryPath,
  DocumentDir: RNFS.DocumentDirectoryPath,
  MainBundleDir: (RNFS as any).MainBundlePath ?? RNFS.DocumentDirectoryPath,
  SDCardDir: (RNFS as any).ExternalStorageDirectoryPath ?? '',
}

export interface OpenDocumentOptions {
  mimeTypes?: string[]
  extTypes?: string[]
  multi?: boolean
  toPath?: string
  encoding?: Encoding
}

export const getExternalStoragePaths = async(_is_removable?: boolean): Promise<string[]> => {
  // 鸿蒙无直接等价,返回空
  return []
}

export const AndroidScoped = {
  async getPersistedUriPermissions(): Promise<string[]> {
    return []
  },
  releasePersistableUriPermission(_path: string) {},
  async openDocumentTree(_isPersist: boolean): Promise<FileType> {
    throw new Error('[RNFileSystem-Harmony] openDocumentTree 暂未实现')
  },
  async openDocument(options: OpenDocumentOptions): Promise<FileType | null> {
    const module = TurboModuleRegistry.getEnforcing<TurboModule & {
      openDocument: (extTypes: string[], toPath: string) => Promise<string>
    }>('UtilsModule')
    const path = await module.openDocument(options.extTypes ?? [], options.toPath ?? '')
    if (!path) return null
    const file = await FileSystem.stat(path)
    file.data = options.encoding ? await RNFS.readFile(path, options.encoding) : path
    return file
  },
}

const dirname = (p: string) => {
  const i = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'))
  return i >= 0 ? p.slice(0, i) : ''
}

export const FileSystem = {
  async cp(source: string, target: string): Promise<void> {
    await RNFS.copyFile(source, target)
  },
  async exists(path: string): Promise<boolean> {
    return RNFS.exists(path)
  },
  async ls(path: string): Promise<FileType[]> {
    const items = await RNFS.readDir(path)
    return items.map(toFileType)
  },
  async mkdir(path: string): Promise<FileType> {
    await RNFS.mkdir(path)
    return this.stat(path)
  },
  async mv(source: string, target: string): Promise<boolean> {
    await RNFS.moveFile(source, target)
    return true
  },
  async rename(source: string, name: string): Promise<boolean> {
    await RNFS.moveFile(source, `${dirname(source)}/${name}`)
    return true
  },
  async readFile(path: string, encoding: Encoding = 'utf8'): Promise<string> {
    return RNFS.readFile(path, encoding)
  },
  async stat(path: string): Promise<FileType> {
    const s = await RNFS.stat(path)
    return toFileType({
      name: path.slice(dirname(path).length + 1),
      path,
      isDirectory: () => s.isDirectory(),
      isFile: () => s.isFile(),
      mtime: s.mtime,
      size: s.size,
    })
  },
  async unlink(path: string): Promise<boolean> {
    await RNFS.unlink(path)
    return true
  },
  async writeFile(path: string, data: string, encoding: Encoding = 'utf8'): Promise<void> {
    await RNFS.writeFile(path, data, encoding)
  },
  async appendFile(path: string, data: string, encoding: Encoding = 'utf8'): Promise<void> {
    await RNFS.appendFile(path, data, encoding)
  },
  async gzipFile(source: string, target: string): Promise<void> {
    const b64 = await RNFS.readFile(source, 'base64')
    const input = Buffer.from(b64, 'base64')
    const out = pako.gzip(input)
    await RNFS.writeFile(target, Buffer.from(out).toString('base64'), 'base64')
  },
  async unGzipFile(source: string, target: string): Promise<void> {
    const b64 = await RNFS.readFile(source, 'base64')
    const input = Buffer.from(b64, 'base64')
    const out = pako.ungzip(input)
    await RNFS.writeFile(target, Buffer.from(out).toString('base64'), 'base64')
  },
  async gzipString(data: string, encoding: Encoding = 'utf8'): Promise<string> {
    const input = encoding === 'base64' ? Buffer.from(data, 'base64') : Buffer.from(data, 'utf8')
    return Buffer.from(pako.gzip(input)).toString('base64')
  },
  async unGzipString(data: string, encoding: Encoding = 'utf8'): Promise<string> {
    const out = pako.ungzip(Buffer.from(data, 'base64'))
    return encoding === 'base64' ? Buffer.from(out).toString('base64') : Buffer.from(out).toString('utf8')
  },
  async hash(path: string, algorithm: HashAlgorithm = 'md5'): Promise<string> {
    return RNFS.hash(path, algorithm)
  },
}
