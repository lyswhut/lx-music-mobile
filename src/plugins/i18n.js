import i18n from 'i18next'
import { useTranslation, initReactI18next } from 'react-i18next'
import langs from '@/lang'

const resources = {}
const supportedLngs = []
const langList = []
for (const { id, name, translation } of langs) {
  resources[id] = {
    id,
    name,
    translation,
  }
  langList.push({
    id,
    name,
  })
  supportedLngs.push(id)
}
// console.log(resources)
export const init = (lang = 'zh_cn') => {
  return i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
      // debug: true,
      resources,
      lng: lang,
      fallbackLng: 'en_us',
      keySeparator: false,
      lowerCaseLng: true,
      interpolation: {
        escapeValue: false,
      },
    })
}

export const changeLanguage = lang => i18n.changeLanguage(lang)

export {
  useTranslation,
  langList,
  i18n,
  supportedLngs,
}
