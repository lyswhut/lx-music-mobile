/**
 * 「修改」浮层（昵称 + 头像）的界面文案。头像只把选中文件复制进本机私有目录，AsyncStorage 只存路径。
 */

/** 「换个快的」昵称候选 */
export const NEW_UI_NICK_PICKS = ['EchoIsle', '深夜电台', '阿野', 'Loop', '听什么都能'] as const

/** 头像可选的文件扩展名 */
export const NEW_UI_AVATAR_EXTS = ['jpg', 'jpeg', 'png', 'webp'] as const

/** 头像文件体积上限 2MB；RN 侧不压缩，超过直接拒收 */
export const NEW_UI_AVATAR_MAX_BYTES = 2 * 1024 * 1024

export const NEW_UI_SHEET_NAME = {
  title: '修改',
  sub: '昵称和头像都只写在这台设备上 · 没选图时，头像取昵称的第一个字。',
  avatarPick: '选一张本机图片',
  avatarReset: '改回昵称首字',
  placeholder: '想叫什么',
  go: '保存',
  errEmpty: '请先填写名称 · 单个汉字也可以',
  groupPicks: '换个快的',
  /** 底部说明：昵称与头像只落本机，换设备回落缺省 */
  hint: '头像与昵称只保存在这台设备的存储里，不上传任何服务器 · 更换设备后回到默认头像与「EchoIsle」。',
  avatarSaved: '头像已换 · 与昵称一起只存在这台设备上',
  avatarResetDone: '头像已改回昵称首字',
  avatarResetSame: '现在用的就是昵称首字',
  avatarErrNotImage: '请选一张图片 · JPG / PNG 都行',
  /** 超过 2MB */
  avatarErrTooLarge: '这张图超过 2MB 了 · 换一张小点的',
  avatarErrRead: '这张图读不出来 · 换一张试试',
  /** 昵称保存成功 toast：只有回落首字态才补一句头像信息 */
  saved: (name: string): string => `昵称已更新为「${name}」`,
  savedWithInitial: (name: string, initial: string): string =>
    `昵称已更新为「${name}」· 头像取首字「${initial}」`,
} as const
