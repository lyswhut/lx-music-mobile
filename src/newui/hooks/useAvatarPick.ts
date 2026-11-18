import { useCallback, useState } from 'react'

import { NEW_UI_AVATAR_EXTS, NEW_UI_AVATAR_MAX_BYTES, NEW_UI_SHEET_NAME } from '@/newui/const'
import { showNewUiToast } from '@/newui/utils'
import { extname, mkdir, moveFile, privateStorageDirectoryPath, selectFile, stat, unlink } from '@/utils/fs'
import { log } from '@/utils/log'

import { useNickName } from './useNickName'

/**
 * 头像文件落点：应用私有目录下单独一格（原型把 dataURL 塞 localStorage，RN 侧落文件）。
 * 单独开子目录而不是直接铺在 DocumentDir 根上，一是选中的文件先被系统选择器复制到这里
 * （toPath 只能指定目录，文件名还是原文件名），二是这一格整体可清、不会和别的存盘混淆。
 */
const AVATAR_DIR = `${privateStorageDirectoryPath}/newui-avatar`

/** 取消 / 兜底都静默（原型 handleImportFile 对空选择也直接 return，不报错、不改状态） */
const removeQuietly = async(path?: string | null): Promise<void> => {
  if (path == null || path.length === 0) return
  await unlink(path).catch(() => {
    // best-effort：删不掉只留一份垃圾文件，不影响头像显示与后续替换
  })
}

export interface NewUiAvatarPick {
  /** 系统选择器正开着 / 正在复制（钮上转 busy，挡连点；原型 label 在同一次点击里只触发一次） */
  picking: boolean
  /** 「选一张本机图片」：系统选择器 → 复制进私有目录 → 换头像（即时生效，与原型 applyAvatarFile 一致） */
  pickAvatar: () => Promise<void>
  /** 「改回昵称首字」：清状态 + 删旧文件（即时生效，与原型 resetAvatar 一致） */
  resetAvatar: () => Promise<void>
}

/**
 * 头像的选图 / 改回动作（原型 app.js 的 applyAvatarFile L1282-1308 与 resetAvatar L1311-1317）。
 *
 * 与原型的三处口径差异（任务书 2026-10-24 第 2 条定，均已写进交付说明）：
 * 1. 不做压缩：原型是 FileReader → canvas 缩到 512 见方 → JPEG 压一道 → 卡 300KB（L1252-1259）；
 *    RN 侧不引图片压缩库，原图直接落盘，改成「超过 2MB 直接拒收」（NEW_UI_AVATAR_MAX_BYTES）。
 * 2. 不存 base64：AsyncStorage 只记本机文件路径（newui.avatarUri），文件本体在 AVATAR_DIR。
 * 3. 没有「存储配额满」那一支：原型要在 localStorage 写不下时回滚并报「这台设备的存储放不下这张图」
 *    （L1294-1300）。RN 这边的失败面只剩「复制 / 移动文件失败」，人话沿用原型那句
 *    「这张图读不出来 · 换一张试试」；AsyncStorage 写失败只影响下次启动（见 useNickName）。
 *
 * 选图链路全部复用既有代码，不新增原生依赖：
 * selectFile（utils/fs.ts:27 → AndroidScoped.openDocument，带 toPath 会把选中文件复制到该目录，
 * 参数判例见 screens/Main/sheets/SourceSheet.tsx:408）→ 扩展名 / 体积复核 → moveFile 换成带时间戳
 * 的文件名（避开同名文件被系统图片库或 RN 图片缓存认成同一张）→ setAvatar。
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
        // 建不出就不用在这儿报：真选不中文件下面会走同一条人话
      })
      const file = await selectFile({ extTypes: [...NEW_UI_AVATAR_EXTS], toPath: AVATAR_DIR })
      copied = file?.data
      // 用户没挑就算取消（原型 applyAvatarFile 对空 file 直接 return，不报错）
      if (copied == null || copied.length === 0) return

      // 类型复核：选择器已按 jpg/jpeg/png/webp 过滤，但 providers 可能回一份别的；不合类型的不留副本
      const ext = extname(copied).toLowerCase()
      if (!NEW_UI_AVATAR_EXTS.some(e => e === ext)) {
        await removeQuietly(copied)
        showNewUiToast(NEW_UI_SHEET_NAME.avatarErrNotImage)
        return
      }
      // 体积先按选择器回传的原文件大小判（DocumentFile.length()），超了连第二份都不留
      if (file != null && file.size > NEW_UI_AVATAR_MAX_BYTES) {
        await removeQuietly(copied)
        showNewUiToast(NEW_UI_SHEET_NAME.avatarErrTooLarge)
        return
      }
      // 文件名带时间戳：同一张图换回来时 URI 不同，RN Image 与系统图片缓存都不会拿旧图凑数
      const target = `${AVATAR_DIR}/avatar-${Date.now()}.${ext}`
      await moveFile(copied, target)
      copied = undefined
      const landed = await stat(target).catch(() => null)
      if (landed == null || !landed.isFile) throw new Error('avatar file not found after move')
      // 复判一次落盘体积：选择器回 0 / 拿不到 size 时以真实文件为准
      if (landed.size > NEW_UI_AVATAR_MAX_BYTES) {
        await removeQuietly(target)
        showNewUiToast(NEW_UI_SHEET_NAME.avatarErrTooLarge)
        return
      }
      const before = avatarUri
      setAvatar(target)
      // 替换成功后才删上一张（best-effort）：中途失败也不会出现「旧图没了新图又没落」的空档
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
    // 本来就没图（原型 resetAvatar L1312：只报一句，不写存储）
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
