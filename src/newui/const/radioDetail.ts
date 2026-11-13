/**
 * 播客详情（U82）与单集屏（U84）的屏上文案与口径常量。
 *
 * **文案逐字取自原型**（不做口语顺化）：`new_design/app.js` 的 `POD_TXT`（L1766-L1777）
 * 与 `openPodcast`（L1998-L2046）/ `openEpisode`（L2167-L2186）/ `renderPodRates`（L2187-L2196）
 * 里内联生成的那几句；静态标记与 aria 名取 `new_design/index.html` L416-L454。
 * 件：`new_design/parts/radio/detail.{html,css}`（U82）、`parts/radio/episode.{html,css}`（U84）。
 *
 * 分工边界（工单纪律）：
 * - 电台首页 / 地区抽屉 / 搜节目那一屏的文案归 `const/radioHome.ts` / `const/radioSearch.ts`，
 *   四屏共用的**封面种子**归 `const/radio.ts`，本文件不碰；
 * - **格式化不在这里**：秒 → 「18 分钟」、ISO → 「10 月 15 日」都归数据层
 *   （`src/newui/podcast/mappers.ts` 的 `podDurationText` / `podDateText`），
 *   本文件只收「已经格式化好的文本」再拼上屏，避免 const 反向依赖数据层。
 *
 * 用词口径（Apple 官方简体中文，件头逐字）：一个 show = **节目**，一期 = **单集**，
 * 量词「N 个节目 / N 集」；「播客」只留作整个频道的名字。屏上不出现 `feedUrl` /
 * `episodeUrl` / URL / 字段名，也不写解释性句子。
 */

/* ================= 一、U82 播客详情屏上文案 ================= */

export const NEW_UI_POD_DETAIL_TXT = {
  /** `.ep-head b`（POD_TXT.epHead L1771）：小标题只留这两字，钉在固定段里 */
  epHead: '单集',
  /** 「共 N 集」← `show.count`（app.js L2014）；接口给不出就不出现 */
  count: (n: number): string => `共 ${n} 集`,
  /** 「最新单集 M 月 D 日」← 首集 releaseDate（app.js L2015）；入参已过 `podDateText` */
  latest: (dateText: string): string => `最新单集 ${dateText}`,
  /** 「还剩 X」← 本机进度（POD_TXT.left L1770）；入参已过 `podDurationText` */
  left: (durationText: string): string => `还剩 ${durationText}`,
  /** 没听过：「播最新单集 · X」（POD_TXT.playLatest L1773） */
  playLatest: (durationText: string): string => `播最新单集 · ${durationText}`,
  /** 听过：「继续播放 · 还剩 X」（POD_TXT.resume L1774） */
  resume: (durationText: string): string => `继续播放 · ${durationText}`,
} as const

/**
 * 详情取数的两态文案。**原型这两句不存在**——U82 在原型里吃同步 mock，取数屏从不进 loading/fail 分支，
 * 所以这一对是按 `_base.css` 的 `.pl-status` 那两档（`正在载入这一区…` / `这一区没有取到名单 · 点击重试`，
 * POD_TXT L1775-L1776）的同一句式为本屏补的。**待用户定**（不满意就换掉，屏上只此两处用到）。
 */
export const NEW_UI_POD_DETAIL_STATUS = {
  loading: '正在载入单集…',
  failed: '这一屏没有取到单集 · 点击重试',
  /**
   * 取回成功但一集都没有（用户 2026-10 确认按此文案）。
   * 与 `failed` 分开说：那一条是「点击重试」，真没有单集时没有可重试的东西。
   */
  empty: '这个播客还没有单集',
} as const

/** 顶排无障碍（`.pl-top` 那颗返回钮 aria-label="返回"，index.html L420 / L435；同 `NEW_UI_PLD_LABELS.back`） */
export const NEW_UI_POD_DETAIL_LABELS = {
  back: '返回',
} as const

/**
 * 「继续播放」那档的门槛（原型 `p.left > 30` 才走 resume，app.js L2027）：
 * 剩不到这个秒数就当作「快听完了」，直接给「播最新单集」。与落盘门槛（`left > 20`，L2238）不是一回事。
 */
export const NEW_UI_POD_RESUME_MIN_LEFT_SEC = 30

/* ================= 二、U84 单集屏 ================= */

/**
 * 倍速五档（原型 `EP_RATES`，app.js L2165）。
 * 本轮用户拍板「接上，能真听」之后，这一档**真传给播放器的播放速率**
 * （`src/newui/podcast/podPlayer.ts` 走既有 `setPlaybackRate`）；
 * 高亮哪档 = 播放器当前的速率，不再只是这一屏的走位速度。
 */
export const NEW_UI_POD_EP_RATES: readonly number[] = [0.75, 1, 1.25, 1.5, 2]

/** `.group-label`（index.html L452） */
export const NEW_UI_POD_EP_TXT = {
  rateGroup: '倍速',
} as const

/** 胶囊字：1 显示「原速」，其余「N 倍」（原型 renderPodRates L2191 逐字） */
export const newUiPodRateLabel = (rate: number): string =>
  rate === 1 ? '原速' : `${rate} 倍`

/**
 * 步进秒数（原型 `epJump(-15)` / `epJump(30)`，index.html L448/L450 + aria「后退十五秒 / 前进三十秒」）。
 * 带数字的环形图标是后续独立一轮（对撞 7.0），本轮先借 `prev` / `next` 字形。
 */
export const NEW_UI_POD_EP_JUMP = {
  backward: -15,
  forward: 30,
} as const

/**
 * 单集屏这颗播放钮被拦下时给的一句话（U84）。
 *
 * **原型没有这一句**：U84 在原型里既不接播放器也不接「定时停止播放」，压根不存在"按下去被拦"这一态，
 * 所以这句是按屏上既有说法为本屏补的（同 `NEW_UI_POD_DETAIL_STATUS` 那一对的处理方式，**待用户定**）。
 *
 * 口径三条：
 * - 用词跟屏上已有的功能名一致——`const/sheet.ts` 的 `NEW_UI_SHEET_TIMER.title` = 「定时停止播放」，
 *   那句 toast 是「已取消定时停止」；这里不写「定时器 / flag / 全局状态」这类开发者说法，
 *   也不写「建设中 / 界面示意」这类元标注（U84 屏上本来一枚 `.wip-tag` 都没有）。
 * - 「节目 / 单集」是 Apple 播客的中文用词（本文件头注那条口径）。
 * - 一句里要把**两件**事说完：现在听不了电台 + 要做什么才能听。
 */
export const NEW_UI_POD_EP_TOAST = {
  /** 「定时停止播放」生效中按播放钮：不进队列、不出声，只给这一句 */
  sleepBlocked: '电台现在听不了：定时停止播放开着，取消后就能听了',
  /**
   * 这一集没拿到音频直链（③ 的 `episodeUrl` 是空串）时按播放钮。
   * **原型没有这一句**（原型单集页从不进「拿不到音源」这一态），按 `sleepBlocked` 同一口径补的，**待用户定**。
   * 不写「直链 / URL / 字段」，只说这一集此刻拿不到音源——用户唯一能做的动作就是换一集或稍后再试。
   */
  noSource: '这一集暂时拿不到音源',
  /**
   * 播放器侧报告这一集放不出来（`podPlayer.ts` 的 `failed`：直链失效、无网络、解码器拒收……）。
   * **原型没有这一句**（同 `noSource`，**待用户定**）。同句管全部失败原因，不把播放器的报错原文端上屏。
   */
  failed: '播放失败，稍后再试',
} as const

/** U84 的无障碍名（逐字取 index.html L447-L450 的 aria-label 与 app.js L2206 的切换值） */
export const NEW_UI_POD_EP_LABELS = {
  back: '返回',
  /** `.pc.main` 静态 aria（L449）；paintEpisode（L2206）按播放态换成下面两句 */
  playToggle: '播放/暂停',
  play: '播放',
  pause: '暂停',
  backward: '后退十五秒',
  forward: '前进三十秒',
} as const

/**
 * 离场落盘的门槛**不在本屏判**：`left <= 20 秒不写` 那道门在数据层 `savePodProgress` 内部
 * （`src/newui/podcast/localState.ts`，原型 app.js L1790-L1794 / L2238 的口径）。
 * 屏上只负责在**每一条离场路径**上把剩余秒数交出去（见 EpisodeScreen 的 flushProgress）。
 */
