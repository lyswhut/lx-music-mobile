import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'

import { NEW_UI_APP_NAME, NEW_UI_DEFAULT_AVATAR_TEXT } from '@/newui/const'
import { existsFile } from '@/utils/fs'

/** 持久化 key（newui 命名空间，与旧设置互不影响） */
const STORAGE_KEY = 'newui.nickName'
/** 头像 key：存本机文件路径（非 base64） */
const AVATAR_STORAGE_KEY = 'newui.avatarUri'

/** 昵称长度上限 */
const NICK_MAX_LENGTH = 12

/** 清洗：去首尾空格、连续空白压成一个、截到 12 字 */
export const sanitizeNick = (raw: string): string =>
  raw.trim().replace(/\s+/g, ' ').slice(0, NICK_MAX_LENGTH)

/** 头像首字：昵称 trim 后第一个字（Array.from 防代理对切碎），空昵称回缺省字再转大写 */
export const nickNameInitial = (nick: string): string =>
  (Array.from(nick.trim())[0] ?? NEW_UI_DEFAULT_AVATAR_TEXT).toUpperCase()

/*
 * 模块级共享值 + 订阅：昵称与头像分属不同屏幕/组件树，用模块作用域的内存缓存与监听集合，
 * 任一实例保存后其余实例即时刷新。不进驻 store、不碰旧设置。
 */
let cachedNick: string | null = null
/** 头像本机文件路径；null = 没有图（回落昵称首字） */
let cachedAvatar: string | null = null
/** 昵称与头像一次读盘，避免出现半截状态 */
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
        // 没读到 / 读脏了就停留在缺省名 EchoIsle
        if (cachedNick == null) cachedNick = saved.length > 0 ? saved : NEW_UI_APP_NAME
        const storedUri = (avatarRaw ?? '').trim()
        if (storedUri.length > 0) {
          /**
           * 存的是本机文件路径，读盘时要验文件还在不在（清缓存、手动删文件都会让路径指空）；
           * 文件没了就回落昵称首字，顺手抹掉过期键，免得每次冷启动白查盘。
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
  /** 当前昵称（未设置过回落品牌名 EchoIsle） */
  nickName: string
  /** 头像首字（有头像图时只当兜底） */
  initial: string
  /** 头像图本机路径；null = 没选图，走昵称首字 */
  avatarUri: string | null
  /** 清洗并持久化昵称；空串忽略。所有实例同步更新 */
  setNickName: (raw: string) => void
  /** 记下一张本机头像图路径并持久化；文件本体由调用方（useAvatarPick）负责复制/清理 */
  setAvatar: (uri: string) => void
  /** 改回昵称首字：只清状态与存储键，磁盘上的旧文件由调用方 best-effort 删 */
  clearAvatar: () => void
}

/**
 * 「我的」页昵称 + 头像：旧设置没有这两项，故新 UI 自存一份（AsyncStorage），不读不改旧设置。
 * 头像只落一条文件路径（不存 base64）。
 */
export const useNickName = (): NewUiNickName => {
  const [nickName, setNickState] = useState(cachedNick ?? NEW_UI_APP_NAME)
  const [avatarUri, setAvatarState] = useState<string | null>(cachedAvatar)

  useEffect(() => {
    // 任一实例保存 → 本实例即时刷新（顶栏 / 我的页 / 浮层预览同源）
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
      // 同上：写不进去只影响下次启动
    })
  }, [])

  const clearAvatar = useCallback(() => {
    cachedAvatar = null
    emit()
    void AsyncStorage.removeItem(AVATAR_STORAGE_KEY).catch(() => {})
  }, [])

  return { nickName, initial: nickNameInitial(nickName), avatarUri, setNickName, setAvatar, clearAvatar }
}
