import { createI18n } from '@/lang/i18n'
import type { I18n } from '@/lang/i18n'
import { getDeviceLanguage } from '@/utils/tools'
import { setLanguage, updateSetting } from '@/core/common'


export default async(setting: LX.AppSetting) => {
  let lang = setting['common.langId']

  global.i18n = createI18n()

  if (!lang || !global.i18n.availableLocales.includes(lang)) {
    const deviceLanguage = (await getDeviceLanguage()).toLowerCase()
    if (typeof deviceLanguage == 'string' && global.i18n.availableLocales.includes(deviceLanguage as I18n['locale'])) {
      lang = deviceLanguage as I18n['locale']
    } else {
      lang = 'en_us'
    }
    updateSetting({ 'common.langId': lang })
  }
  setLanguage(lang)
}
