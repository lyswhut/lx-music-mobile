import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'

import { NEW_UI_APP_NAME, NEW_UI_DEFAULT_AVATAR_TEXT } from '@/newui/const'
import { existsFile } from '@/utils/fs'

/** 持久化 key：与 newui.themeMode 同命名空间，旧设置（@/plugins/storage）互不影响 */
const STORAGE_KEY = 'newui.nickName'
/** 头像 key：存的是本机文件路径（不是 base64），文件本体在私有目录，见 hooks/useAvatarPick */
const AVATAR_STORAGE_KEY = 'newui.avatarUri'

/** 昵称长度上限（原型 saveNick 的 slice(0, 12)） */
const NICK_MAX_LENGTH = 12

/** 清洗规则同原型 saveNick：去首尾空格、内部连续空白压成一个、截到 12 字 */
export const sanitizeNick = (raw: string): string =>
  raw.trim().replace(/\s+/g, ' ').slice(0, NICK_MAX_LENGTH)

/**
 * 头像首字（原型 nickInitial）：昵称 trim 后第一个字（Array.from 保证代理对不切碎），
 * 空昵称回落缺省字「E」（NEW_UI_DEFAULT_AVATAR_TEXT，拉丁品牌 EchoIsle 取首字母）再转大写。
 * 导出给浮层做「保存后 toast 里预告新首字」用（原型 toast 文案 L1353）。
 */
export const nickNameInitial = (nick: string): string =>
  (Array.from(nick.trim())[0] ?? NEW_UI_DEFAULT_AVATAR_TEXT).toUpperCase()

/*
 * 模块级共享值 + 订阅（阶段 9e 加，2026-10-24 扩到「昵称 + 头像」）：
 * 昵称与头像各有多个消费点（顶栏头像、我的页头部、修改浮层预览），且分属不同屏幕/组件树。
 * useNickName 各实例若只持有本地 useState，浮层保存后其他实例要到重挂载才刷新。
 * 这里在 newui 自己的模块作用域内做一份内存缓存与监听集合——不进驻 store、不碰旧设置，
 * 仍是「新 UI 自存一份」的原口径。原型侧对应的是 state.name / state.avatar + renderProfile
 * 一次刷三处（app.js L1245-1250），故两个值走同一份快照、同一次通知。
 */
let cachedNick: string | null = null
/** 头像本机文件路径；null = 没有图（回落昵称首字），原型 state.avatar 的同一语义 */
let cachedAvatar: string | null = null
/** 昵称与头像一次读盘（两个 key 一起读，避免头像是图但昵称还是缺省字这种半截状态） */
let loaded = false
let loadingPromise: Promise<void> | null = null
interface NickSnapshot {
  nickName: string
  avatarUri: string | null
}
const listeners = new Set<(next: NickSnapshot) => void>()

const snapshotOf = (): NickSnapshot => ({
  nickName: cachedNick ?? NEW_UI_APP_NAME,
  avatarUri: cachedAvatar,
})

const emit = (): void => {
  const next = snapshotOf()
  for (const listener of listeners) listener(next)
}

const loadOnce = async(): Promise<void> => {
  if (loaded) return
  if (loadingPromise == null) {
    loadingPromise = Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(AVATAR_STORAGE_KEY),
    ])
      .then(async([nickRaw, avatarRaw]) => {
        const saved = sanitizeNick(nickRaw ?? '')
        // 没读到 / 读脏了就停留在缺省名 EchoIsle（原型 BRAND，浮层底部说明同口径）
        if (cachedNick == null) cachedNick = saved.length > 0 ? saved : NEW_UI_APP_NAME
        const storedUri = (avatarRaw ?? '').trim()
        if (storedUri.length > 0) {
          /**
           * 存的是本机文件路径，所以读盘时要验一下文件还在不在：清缓存、用户手动删文件、
           * 换机恢复备份都会让这条路径指空。文件没了就回落昵称首字（原型没有这一支——
           * 它的头像是 dataURL 本身，路径失效这种失败模式不存在），顺手把过期键抹掉，
           * 免得每次冷启动都白查一次盘。
           */
          const exists = await existsFile(storedUri).catch(() => false)
          if (exists) cachedAvatar = storedUri
          else void AsyncStorage.removeItem(AVATAR_STORAGE_KEY).catch(() => {})
        }
        loaded = true
      })
      .catch(() => {
        if (cachedNick == null) cachedNick = NEW_UI_APP_NAME
        loaded = true
      })
      .finally(() => {
        loadingPromise = null
      })
  }
  return loadingPromise
}

export interface NewUiNickName {
  /** 当前昵称（未设置过回落品牌名 EchoIsle，与原型缺省名和浮层说明一致） */
  nickName: string
  /** 头像首字（我的页 .mh-art 与顶栏头像共用；有头像图时只当兜底） */
  initial: string
  /** 头像图的本机文件路径；null = 没选图，走昵称首字（原型 state.avatar） */
  avatarUri: string | null
  /** 清洗并持久化昵称；空串忽略。所有 useNickName 实例同步更新（改昵称浮层接线） */
  setNickName: (raw: string) => void
  /** 记下一张本机头像图路径并持久化；文件本体由调用方（useAvatarPick）负责复制/清理 */
  setAvatar: (uri: string) => void
  /** 改回昵称首字：只清状态与存储键，磁盘上的旧文件由调用方 best-effort 删 */
  clearAvatar: () => void
}

/**
 * 「我的」页昵称 + 头像（原型 state.name / state.avatar）。
 * 核实过旧 AppSetting（src/types/app_setting.d.ts）没有任何用户昵称/头像键，
 * 故新 UI 自存一份（AsyncStorage，同 ThemeProvider 的模式）；不读不改旧设置。
 * 昵称落 newui.nickName，头像只落一条文件路径 newui.avatarUri（**不存 base64**：
 * 原型是 dataURL，RN 侧图片到手就是私有目录里的一个文件，存路径更省空间也避免大字符串进 KV）。
 * 「修改」浮层（screens/Main/sheets/NameSheet）是本 hook 的唯一写入口。
 */
export const useNickName = (): NewUiNickName => {
  const [nickName, setNickState] = useState(cachedNick ?? NEW_UI_APP_NAME)
  const [avatarUri, setAvatarState] = useState<string | null>(cachedAvatar)

  useEffect(() => {
    // 任一实例保存 → 本实例即时刷新（顶栏 / 我的页 / 浮层预览因此同源，对齐原型 renderProfile 同步三处）
    const handleChanged = (next: NickSnapshot) => {
      setNickState(next.nickName)
      setAvatarState(next.avatarUri)
    }
    listeners.add(handleChanged)
    if (!loaded) {
      void loadOnce().then(() => {
        setNickState(cachedNick ?? NEW_UI_APP_NAME)
        setAvatarState(cachedAvatar)
      })
    }
    return () => {
      listeners.delete(handleChanged)
    }
  }, [])

  const setNickName = useCallback((raw: string) => {
    const next = sanitizeNick(raw)
    if (!next) return
    cachedNick = next
    emit()
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // 持久化失败仅影响下次启动，本次会话内生效
    })
  }, [])

  const setAvatar = useCallback((uri: string) => {
    const next = uri.trim()
    if (!next) return
    cachedAvatar = next
    emit()
    void AsyncStorage.setItem(AVATAR_STORAGE_KEY, next).catch(() => {
      // 同上：写不进去只影响下次启动（重启后 existsFile 也未必还找得到那条路径）
    })
  }, [])

  const clearAvatar = useCallback(() => {
    cachedAvatar = null
    emit()
    void AsyncStorage.removeItem(AVATAR_STORAGE_KEY).catch(() => {})
  }, [])

  return { nickName, initial: nickNameInitial(nickName), avatarUri, setNickName, setAvatar, clearAvatar }
}
