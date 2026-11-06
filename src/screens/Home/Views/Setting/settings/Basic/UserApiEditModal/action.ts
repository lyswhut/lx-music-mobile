import { importUserApi } from '@/core/userApi'
import { state } from '@/store/userApi'
import { readFile } from '@/utils/fs'
import { log } from '@/utils/log'
import { toast } from '@/utils/tools'


export const handleImportScript = async(script: string) => {
  await importUserApi(script).then(() => {
    toast(global.i18n.t('user_api_import_success_tip'))
  }).catch((error: any) => {
    log.error(error.stack)
    toast(global.i18n.t('user_api_import_failed_tip', { message: error.message }), 'long')
  })
}

// 从脚本内容中解析音源名称（@name），用于重复导入判断
const getScriptName = (script: string): string => {
  const header = /^\/\*[\S|\s]+?\*\//.exec(script)?.[0]
  const name = header?.match(/@name\s+([^\r\n*]+)/)?.[1]?.trim()
  return name ?? ''
}

// 导入单个脚本，返回：'success' | 'duplicate' | 'failed'
const importSingle = async(path: string): Promise<'success' | 'duplicate' | 'failed'> => {
  const script = await readFile(path)
  if (script == null) throw new Error('Read file failed')
  const name = getScriptName(script)
  if (name && state.list.some(api => api.name.trim().toLowerCase() == name.toLowerCase())) {
    return 'duplicate'
  }
  await importUserApi(script)
  return 'success'
}

// 批量导入：用户手动多选音源脚本文件后逐个导入，已导入过的自动跳过并提示
export const handleImportLocalFile = (paths: string | string[]) => {
  const files = Array.isArray(paths) ? paths : [paths]
  const isBatch = files.length > 1
  void (async() => {
    let success = 0
    let failed = 0
    let duplicate = 0
    const duplicateNames: string[] = []
    let firstError = ''
    for (const file of files) {
      try {
        const result = await importSingle(file)
        if (result == 'success') {
          success++
        } else {
          duplicate++
          duplicateNames.push(file.split('/').pop() ?? file)
        }
      } catch (error: any) {
        failed++
        if (!firstError) firstError = error.message
        log.error(error.stack)
      }
    }
    if (!isBatch) {
      // 单文件保持原有提示方式
      if (duplicate) toast(global.i18n.t('user_api_import_duplicate_tip', { names: duplicateNames.join('、') }), 'long')
      else if (success) toast(global.i18n.t('user_api_import_success_tip'))
      else toast(global.i18n.t('user_api_import_failed_tip', { message: firstError }), 'long')
      return
    }
    if (duplicateNames.length > 2) duplicateNames.length = 2
    const dupNames = duplicateNames.length ? `${duplicateNames.join('、')}${duplicate > duplicateNames.length ? '…' : ''}` : ''
    toast(global.i18n.t('user_api_import_batch_tip', { success, failed }), 'long')
    if (duplicate) toast(global.i18n.t('user_api_import_duplicate_tip', { names: dupNames }), 'long')
  })().catch((error: any) => {
    log.error(error.stack)
    toast(global.i18n.t('user_api_import_failed_tip', { message: error.message }), 'long')
  })
}
