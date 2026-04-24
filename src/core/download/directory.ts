import { externalStorageDirectoryPath, readDir, mkdir } from '@/utils/fs'
import { getDownloadSavePath } from '@/utils/data'
import { toast } from '@/utils/common'
import settingState from '@/store/setting/state'

export const getSaveDirectory = async(): Promise<string> => {
  const customPath = settingState.setting['download.savePath']
  if (!customPath) return externalStorageDirectoryPath

  const { valid, reason } = await validateDirectory(customPath)
  if (!valid) {
    toast(`download_directory_invalid_tip`, reason)
    return externalStorageDirectoryPath
  }

  return customPath
}

export const validateDirectory = async(path: string): Promise<{ valid: boolean; reason?: string }> => {
  try {
    await readDir(path)
    return { valid: true }
  } catch (err: any) {
    return { valid: false, reason: err?.message ?? 'unknown_error' }
  }
}

export const ensureDirectory = async(path: string): Promise<void> => {
  try {
    await readDir(path)
  } catch {
    await mkdir(path)
  }
}
