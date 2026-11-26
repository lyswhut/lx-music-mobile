import { useCallback, useState } from 'react'

import { NEW_UI_AVATAR_EXTS, NEW_UI_AVATAR_MAX_BYTES, NEW_UI_SHEET_NAME } from '@/newui/const'
import { showNewUiToast } from '@/newui/utils'
import { extname, mkdir, moveFile, privateStorageDirectoryPath, selectFile, stat, unlink } from '@/utils/fs'
import { log } from '@/utils/log'

import { useNickName } from './useNickName'

/**
 * 头像文件落点：应用私有目录下单独一格。选中的文件先被系统选择器复制到这里，
 * 这一格整体可清、不与别的存盘混淆。
 */
const AVATAR_DIR = `${privateStorageDirectoryPath}/newui-avatar`

/** 取消 / 兜底都静默 */
const removeQuietly = async(path?: string | null): Promise<void> => {
  if (path == null || path.length === 0) return
  await unlink(path).catch(() => {
    // best-effort：删不掉只留一份垃圾文件，不影响头像显示与后续替换
  })
}

export interface NewUiAvatarPick {
  /** 系统选择器正开着 / 正在复制（挡连点） */
  picking: boolean
  /** 选一张本机图片 → 复制进私有目录 → 换头像（即时生效） */
  pickAvatar: () => Promise<void>
  /** 改回昵称首字：清状态 + 删旧文件（即时生效） */
  resetAvatar: () => Promise<void>
}

/**
 * 头像的选图 / 改回动作。
 * 不做压缩（超过 2MB 直接拒收）、不存 base64（AsyncStorage 只记文件路径）；
 * 失败面只剩复制 / 移动文件失败。选图复用 selectFile → 扩展名 / 体积复核 → moveFile 带时间戳。
 */
export const useAvatarPick = (): NewUiAvatarPick => {
  const { avatarUri, setAvatar, clearAvatar } = useNickName()
  const [picking, setPicking] = useState(false)

  const pickAvatar = useCallback(async() => {
    if (picking) return
    setPicking(true)
    let copied: string | undefined
    try {
      // 目录不存在时 openDocument 的复制会失败，先建（已存在也调一次，幂等）
      await mkdir(AVATAR_DIR).catch(() => {
        // 建不出不在此报，真选不中会走下面的统一提示
      })
      const file = await selectFile({ extTypes: [...NEW_UI_AVATAR_EXTS], toPath: AVATAR_DIR })
      copied = file?.data
      // 用户没挑就算取消，不报错
      if (copied == null || copied.length === 0) return

      // 选择器已过滤类型，但 provider 可能回别的，不合类型不留副本
      const ext = extname(copied).toLowerCase()
      if (!NEW_UI_AVATAR_EXTS.some(e => e === ext)) {
        await removeQuietly(copied)
        showNewUiToast(NEW_UI_SHEET_NAME.avatarErrNotImage)
        return
      }
      // 先按选择器回传的原文件大小判，超了不留副本
      if (file != null && file.size > NEW_UI_AVATAR_MAX_BYTES) {
        await removeQuietly(copied)
        showNewUiToast(NEW_UI_SHEET_NAME.avatarErrTooLarge)
        return
      }
      // 文件名带时间戳：同一张图换回来时 URI 不同，避免图片缓存拿旧图
      const target = `${AVATAR_DIR}/avatar-${Date.now()}.${ext}`
      await moveFile(copied, target)
      copied = undefined
      const landed = await stat(target).catch(() => null)
      if (landed == null || !landed.isFile) throw new Error('avatar file not found after move')
      // 复判落盘体积（选择器回 0 / 拿不到 size 时以真实文件为准）
      if (landed.size > NEW_UI_AVATAR_MAX_BYTES) {
        await removeQuietly(target)
        showNewUiToast(NEW_UI_SHEET_NAME.avatarErrTooLarge)
        return
      }
      const before = avatarUri
      setAvatar(target)
      // 替换成功后才删上一张，避免中途失败出现空档
      if (before != null && before !== target) await removeQuietly(before)
      showNewUiToast(NEW_UI_SHEET_NAME.avatarSaved)
    } catch (err: any) {
      log.warn('pick newui avatar failed: ' + String(err?.message ?? err))
      if (copied != null) await removeQuietly(copied)
      showNewUiToast(NEW_UI_SHEET_NAME.avatarErrRead)
    } finally {
      setPicking(false)
    }
  }, [avatarUri, picking, setAvatar])

  const resetAvatar = useCallback(async() => {
    // 本来就没图：只提示，不写存储
    if (avatarUri == null) {
      showNewUiToast(NEW_UI_SHEET_NAME.avatarResetSame)
      return
    }
    const before = avatarUri
    clearAvatar()
    await removeQuietly(before)
    showNewUiToast(NEW_UI_SHEET_NAME.avatarResetDone)
  }, [avatarUri, clearAvatar])

  return { picking, pickAvatar, resetAvatar }
}
