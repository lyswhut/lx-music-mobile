import { importUserApi } from '@/core/userApi'
import { log } from '@/utils/log'
import { readFile } from '@/utils/nativeModules/utils'
import { toast } from '@/utils/tools'


export const handleImport = (path: string) => {
  // toast(global.i18n.t('setting_backup_part_import_list_tip_unzip'))
  void readFile(path).then(async script => {
    if (script == null) throw new Error('Read file failed')
    await importUserApi(script)
  }).catch((error: any) => {
    log.error(error.stack)
    toast(global.i18n.t('user_api_import_failed_tip'))
  })
}

