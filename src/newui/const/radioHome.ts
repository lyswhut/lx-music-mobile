/**
 * 电台首页（U81 `parts/radio/home.{html,css}`）屏上文案。
 *
 * **逐字引用原型 `POD_TXT`（app.js L1766-1777）与 `PLD_STATUS`（L859）**，不顺口改写。
 * 数据层 `src/newui/podcast/` 不产文案（见其 hooks.ts 文件头），本屏只认这里。
 *
 * 口径（index.html L748 / L761）：屏上只留**名词与数字 + 按钮动词 + 必要操作反馈**，
 * 接口能力边界一律不上屏；用词按 Apple 官方简体中文——一个 show = 「节目」，
 * 一期 = 「单集」，量词「N 个节目」，「播客」只作频道名（「档」不是它的说法）。
 * 终点行「没有更多了」不在此重复定义，复用 `const/app.ts` 的 `NEW_UI_PAGING_END_TEXT`。
 */

/** 顶排面包屑（原型 #radioCrumb 静态文字，index.html L389） */
export const NEW_UI_RADIO_HOME_CRUMB = '电台'

/** 无障碍与图标钮口头说明（屏上不出字） */
export const NEW_UI_RADIO_HOME_LABELS = {
  /** #radioBack */
  back: '返回',
  /** #podSearchBtn（index.html L391 aria-label，L767 那条改名已并入） */
  search: '搜节目',
  /** .subs-x 的 aria-label：`取消收听 ${s.name}`（app.js L1839） */
  unsub: (name: string): string => `取消收听 ${name}`,
} as const

/** 订阅那一区（.subs-block：标题行 + 卡片 + 空态） */
export const NEW_UI_RADIO_HOME_SUBS = {
  /** .subs-head b（POD_TXT.subs） */
  title: '我听的',
  /** .subs-head em（POD_TXT.subsSub）：标题右侧只剩这个数 */
  count: (n: number): string => `${n} 个节目`,
  /** .subs-empty：空了不塌成一条。
   *  **本轮有意偏离原型一句**：原型静态文案是「还没有收听的节目」（POD_TXT.subsEmpty），
   *  但原型手边挂着 POD_SUB_SEED 两条演示数据、空态几乎见不到；RN 侧不搬 seed，
   *  新装机「我听的」恒为空是正常态（用户定），且「听过就自动进名单」没有手动钮——
   *  空态要把这条路说清楚（引导去听节目），照主流播客 App 的说法，不写开发者术语。 */
  empty: '去下面的榜里挑一个节目 · 听过就会出现在这里',
  /** .sub-l（POD_TXT.left）：`还剩 X`，X 由数据层 `podDurationText` 先格式化好再传进来；
   *  没听过就不写这一行（app.js L1832「不编『未听』这种话」） */
  remaining: (duration: string): string => `还剩 ${duration}`,
} as const

/** 当前地区那一行（.pod-region，index.html L395） */
export const NEW_UI_RADIO_HOME_REGION = {
  /** .section-more 那颗的文案 */
  more: '更多地区',
} as const

/**
 * 榜列状态行（`.pl-status` 一族，两条互斥）：
 * 换区在途 / 这一区没取到。**取不到不假装榜是空的**（index.html L760），
 * 所以失败态走这一行而不是 .subs-empty 那种色块。
 */
export const NEW_UI_RADIO_HOME_STATUS = {
  /** POD_TXT.regionLoading（app.js L1774） */
  regionLoading: '正在载入这一区…',
  /** POD_TXT.regionFail（app.js L1775） */
  regionFailed: '这一区没有取到名单 · 点击重试',
} as const

/** 操作反馈 toast（原型 unsubPod L1844-1847：只改本机名单，成功后给一句） */
export const NEW_UI_RADIO_HOME_TOAST = {
  /** POD_TXT.subRemove */
  unsubbed: '已从这台设备移除',
} as const

/** 地区抽屉（U85 `parts/sheets/region-sheet.html`）标题；**没有副题**（件头：槽位宁可空着） */
export const NEW_UI_POD_REGION_SHEET = {
  title: '收听地区',
} as const
