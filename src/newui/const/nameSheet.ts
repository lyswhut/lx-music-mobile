/**
 * 「修改」浮层（原型 #nameSheet，index.html L583-606；逻辑 paintAvatar / applyAvatarFile /
 * resetAvatar / openNameSheet / saveNick，app.js L1235-1355）的界面文案。每条标注原型行号。
 *
 * 2026-10-24 起这一层管两件事：昵称 + 头像（原型把入口钮从「改昵称」改成「修改」）。
 * 头像的落地口径与原型不同：原型是浏览器那套 FileReader → canvas 缩到 512 → JPEG 压到 ≤300KB
 * 的 dataURL 塞 localStorage（app.js L1252-1257）；RN 侧不引压缩库，直接把选中文件复制进
 * 本机私有目录、AsyncStorage 只存文件路径（键 newui.avatarUri），体积上限见下方常量注释。
 */

/**
 * 「换个快的」chips（原型 NICK_PICKS，app.js L1230）。
 * 纯 UI 文案而非内容数据，按「不造假数据」规则可保留；
 * 首枚取原型 BRAND 变量（data.js L8 `const BRAND = 'EchoIsle'`），与我们 const/app.ts
 * 的 NEW_UI_APP_NAME 同名同值，无需再改写。
 */
export const NEW_UI_NICK_PICKS = ['EchoIsle', '深夜电台', '阿野', 'Loop', '听什么都能'] as const

/**
 * 头像可选的文件扩展名（原型 #avFile 的 `accept="image/*"`，index.html L595）。
 * RN 侧走系统选择器，extTypes 只收这四档（jpg/jpeg/png/webp）。
 */
export const NEW_UI_AVATAR_EXTS = ['jpg', 'jpeg', 'png', 'webp'] as const

/**
 * 头像文件体积上限 2MB。
 * 原型**没有**这条限制：它在浏览器里把图缩到 512 见方再压 JPEG、卡 300KB（app.js L1252-1257）。
 * RN 按任务书口径不引压缩库、原图直接落盘，故改成「超过 2MB 直接拒收，让用户换一张」；
 * 这是与原型的第一处已知差异，已写进交付说明。
 */
export const NEW_UI_AVATAR_MAX_BYTES = 2 * 1024 * 1024

export const NEW_UI_SHEET_NAME = {
  /** .sheet-title（index.html L587） */
  title: '修改',
  /** .sheet-sub（index.html L588） */
  sub: '昵称和头像都只写在这台设备上 · 没选图时，头像取昵称的第一个字。',
  /** 头像一行两枚次级钮（.op-file span，index.html L592 / L593） */
  avatarPick: '选一张本机图片',
  avatarReset: '改回昵称首字',
  /** .op-input placeholder（index.html L597） */
  placeholder: '想叫什么',
  /** .op-go（index.html L598） */
  go: '保存',
  /** 空昵称报错（原型 saveNick 内 app.js L1339 逐字，QA D59） */
  errEmpty: '请先填写名称 · 单个汉字也可以',
  /** .group-label（index.html L602） */
  groupPicks: '换个快的',
  /**
   * 底部说明（原型 index.html L604 .sc-hint 逐字）。
   * 那句「更换设备后回到默认头像与「EchoIsle」」在真实侧同样成立：昵称与头像路径只落本机
   * （AsyncStorage + 私有目录），换设备读不到时回落缺省字（const/app.ts NEW_UI_DEFAULT_AVATAR_TEXT）。
   */
  hint: '头像与昵称只保存在这台设备的存储里，不上传任何服务器 · 更换设备后回到默认头像与「EchoIsle」。',
  /** 选图成功 toast（app.js L1304 逐字） */
  avatarSaved: '头像已换 · 与昵称一起只存在这台设备上',
  /** 改回首字成功 toast（app.js L1316 逐字） */
  avatarResetDone: '头像已改回昵称首字',
  /** 本来就没图、还点「改回昵称首字」（app.js L1312 逐字） */
  avatarResetSame: '现在用的就是昵称首字',
  /** 选中的不是图片（app.js L1284 逐字；选择器已按四档扩展名过滤，这条只做兜底） */
  avatarErrNotImage: '请选一张图片 · JPG / PNG 都行',
  /**
   * 超过 2MB（RN 侧口径，见 NEW_UI_AVATAR_MAX_BYTES）。
   * 原型对应的是「这张图压完还是太大 · 换一张小点的」（app.js L1290）——那句说的是「压完」，
   * RN 这版不压缩，所以不能照抄，改成把真实上限讲清楚的同一口气。
   */
  avatarErrTooLarge: '这张图超过 2MB 了 · 换一张小点的',
  /** 读不出 / 复制失败（app.js L1306「这张图读不出来 · 换一张试试」逐字，RN 侧把复制失败一起兜在这里） */
  avatarErrRead: '这张图读不出来 · 换一张试试',
  /**
   * 昵称保存成功 toast。原型 app.js L1349-1353：头像已经是图片时只说昵称，
   * 只有回落首字态才补一句「头像取首字」——换昵称不该把图换掉，也不该乱许诺头像会变。
   */
  saved: (name: string): string => `昵称已更新为「${name}」`,
  /** 无头像图时那一档（app.js L1353 逐字） */
  savedWithInitial: (name: string, initial: string): string =>
    `昵称已更新为「${name}」· 头像取首字「${initial}」`,
} as const
