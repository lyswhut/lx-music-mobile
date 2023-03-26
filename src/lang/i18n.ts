import { useState, useEffect, useCallback } from 'react'
import type { Messages, Message } from './index'
import { messages } from './index'


type TranslateValues = Record<string, string | number | boolean>

type Langs = keyof Messages

type Hook = (locale: Langs) => void

export declare interface I18n {
  locale: Langs
  fallbackLocale: Langs
  availableLocales: Langs[]
  messages: Messages
  message: Message
  setLanguage: (locale: Langs) => void
  fillMessage: (message: string, val: TranslateValues) => string
  getMessage: (key: keyof Message, val?: TranslateValues) => string
  t: (key: keyof Message, val?: TranslateValues) => string
}

let locale: Langs = 'zh_cn'

let i18n: I18n


const hookTools = {
  hooks: [] as Hook[],
  add(hook: Hook) {
    this.hooks.push(hook)
  },
  remove(hook: Hook) {
    this.hooks.splice(this.hooks.indexOf(hook), 1)
  },
  update(locale: Parameters<Hook>[0]) {
    for (const hook of this.hooks) hook(locale)
  },
}

const useI18n = () => {
  const [locale, updateLocale] = useState(i18n?.locale ?? 'en_us')
  // console.log('hook run')
  useEffect(() => {
    const hook: Hook = (locale) => {
      updateLocale(locale)
    }
    hookTools.add(hook)
    return () => { hookTools.remove(hook) }
  }, [])

  return useCallback((key: keyof Message, val?: TranslateValues): string => {
    return i18n.getMessage(key, val)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])
}

const setLanguage = (lang: Langs) => {
  i18n.setLanguage(lang)
}

const createI18n = (_locale: Langs = locale): I18n => {
  locale = _locale

  return i18n = {
    locale,
    fallbackLocale: 'zh_cn',
    availableLocales: Object.keys(messages) as Langs[],
    messages,
    message: messages[locale],
    setLanguage(_locale: Langs) {
      this.locale = _locale
      this.message = messages[_locale]
      hookTools.update(_locale)
    },
    fillMessage(message: string, vals: TranslateValues): string {
      for (const [key, val] of Object.entries(vals)) {
        message = message.replace(new RegExp('{' + key + '}', 'g'), String(val))
      }
      return message
    },
    getMessage(key: keyof Message, val?: TranslateValues): string {
      let targetMessage = this.message[key] ?? this.messages[this.fallbackLocale][key] ?? ''
      return val ? this.fillMessage(targetMessage, val) : targetMessage
    },
    t(key: keyof Message, val?: TranslateValues): string {
      return this.getMessage(key, val)
    },
  }
}


export {
  setLanguage,
  useI18n,
  createI18n,
}
