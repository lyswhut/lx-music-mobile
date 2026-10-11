import RNFS from 'react-native-fs'

async function directorySize(path: string): Promise<number> {
  const entries = await RNFS.readDir(path)
  const sizes = await Promise.all(entries.map(async entry => {
    return entry.isDirectory() ? directorySize(entry.path) : Number(entry.size) || 0
  }))
  return sizes.reduce((total, size) => total + size, 0)
}

export const getAppCacheSize = async(): Promise<number> => Math.trunc(await directorySize(RNFS.CachesDirectoryPath))

export const clearAppCache = async(): Promise<void> => {
  const entries = await RNFS.readDir(RNFS.CachesDirectoryPath)
  await Promise.all(entries.map(entry => RNFS.unlink(entry.path)))
}
