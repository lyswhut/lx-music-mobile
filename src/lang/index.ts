import zh_cn from './zh_cn.json'
import en_us from './en_us.json'

type Message = Record<keyof typeof zh_cn, string>
| Record<keyof typeof en_us, string>


const langs = [
  {
    name: '简体中文',
    locale: 'zh_cn',
    // alternate: 'zh-hans',
    country: 'cn',
    fallback: true,
    message: zh_cn,
  },
  {
    name: 'English',
    locale: 'en_us',
    country: 'us',
    message: en_us,
  },
] as const

const langList: Array<{
  name: string
  locale: (typeof langs)[number]['locale']
  // alternate?: string
}> = []
type Messages = Record<(typeof langs)[number]['locale'], Message>

// @ts-expect-error
const messages: Messages = {}

langs.forEach(item => {
  langList.push({
    name: item.name,
    locale: item.locale,
    // alternate: item.alternate,
  })
  messages[item.locale] = item.message
})

export {
  langList,
  messages,
}

export type {
  Messages,
  Message,
}

export * from './i18n'
