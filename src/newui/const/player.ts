/**
 * 播放页（原型 .player-layer）界面文案与模式表。
 * 循环模式对齐项目既有设置 `player.togglePlayMethod`（@/config/constant 的 MUSIC_TOGGLE_MODE），
 * 原型的三态（list/one/shuffle）在本项目里是五态；原型已为顺序播放/播完即停画出独立轮廓
 * （i-repeat-off / i-stop-after），五态各自对号，不再就近复用。
 */
import { MUSIC_TOGGLE_MODE } from '@/config/constant'

import type { IconName } from '@/newui/components'

import { NEW_UI_APP_NAME } from './app'

/** 播放页顶栏面包屑 */
export const NEW_UI_PLAYER_CRUMB = '正在播放'

/**
 * 主控制行三颗 + 次级工具行四颗的无障碍文案。
 * 2026-10-13 控件行改版（原型 index.html L339-351）：工具行只剩图形、不给选中底色也不给文字，
 * 状态一律写进 aria-label 并随状态更新（app.js paintTimerTag / paintFloatBtn / L1760）。
 * 【歌词】【均衡】钮已分别改由舞台横滑进入 / 随假能力移除，此表不收 lyric / eq 文案。
 */
export const NEW_UI_PLAYER_TOOL_ARIA = {
  timerOff: '定时停止播放 · 未开启',
  /** 开启态带剩余时间（原型 app.js L1772 paintTimerTag：`还剩 ${fmt(sleepLeft)}`，逐秒回写；
   *  轮 6 暂用的简式「· 已开启」于轮 11 换成原型口径，只改文案不动图标逻辑） */
  timerOn: (mmss: string): string => `定时停止播放 · 还剩 ${mmss}`,
  floatOff: 'LRC 浮窗 · 未开启',
  floatOn: 'LRC 浮窗 · 已开启',
  comment: '评论',
} as const

/** 循环钮 aria-label（原型 app.js L1817：`循环模式 · ${LOOP_NAME[state.loop]}`） */
export const newUiPlayerLoopAria = (label: string): string => `循环模式 · ${label}`

/**
 * 「上一曲」钮的回退阈值（原型 app.js L2615 `state.t > 3 ? seekTo(0) : step(-1)`，QA D03）：
 * 当前这首已经播过 3 秒，第一下先回到开头，再按才是前一首（主流 App 惯例）。
 */
export const NEW_UI_PLAYER_PREV_RESTART_SEC = 3

/** 「来自 XX 音源」整句（原型 .ps-from：'来自 ' + script().name，app.js L1719）。
 * QA 2026-10-14 D-02（播放器报告 D-3）：未导入音源时 apiName 为空串，
 * 原型 mock 恒有值、真实环境会渲染成「来自  音源」双空格破句——
 * 空名改说「还没有选好音源」，与首页轮播同一口径（useHomeBanners） */
export const newUiPlayerApiSourceText = (apiName: string): string =>
  apiName.length > 0 ? `来自 ${apiName} 音源` : '还没有选好音源'

/** 歌词缺失 / 加载中（原型 app.js L1843 逐字，QA D75） */
export const NEW_UI_PLAYER_LYRIC_EMPTY = '这首歌暂时没有歌词 · 或歌词仍在载入'

/** 歌词区尾部说明（原型「此处为原型占位文案」一句在真实数据下不再成立，改为如实说明） */
export const NEW_UI_PLAYER_LYRIC_NOTE = '歌词由各平台提供'

/** 没有在播的曲目时的舞台提示（正常入口不会走到，兜底用） */
export const NEW_UI_PLAYER_NO_SONG = '现在没有要播的歌'

/** 循环模式：图标 + 文案（原型 LOOP_ICON 的项目五态版，五态五轮廓） */
export const PLAYER_PLAY_MODE_META: Record<string, { icon: IconName, label: string }> = {
  [MUSIC_TOGGLE_MODE.listLoop]: { icon: 'repeat', label: '列表循环' },
  [MUSIC_TOGGLE_MODE.random]: { icon: 'shuffle', label: '随机播放' },
  [MUSIC_TOGGLE_MODE.list]: { icon: 'repeatOff', label: '顺序播放' },
  [MUSIC_TOGGLE_MODE.singleLoop]: { icon: 'repeat1', label: '单曲循环' },
  [MUSIC_TOGGLE_MODE.none]: { icon: 'stopAfter', label: '播完即停' },
}

/** 「LRC 浮窗」开关反馈（QA 2026-10-14 D-01 / P0）。
 *  本实现是系统级桌面歌词悬浮窗（core/desktopLyric），不是原型的 App 内贴底胶囊；
 *  旧文案「进入播放页自动隐藏」全项目无实现，属假承诺，已整体删除（对应语义要么实现、
 *  要么不出现在文案里——本轮取后者，播放页本就有全屏歌词，浮窗只在 App 外有意义）。
 *  未播放任何曲目时窗口没有可见内容，开启必须先有在播曲目（见 useDesktopLyricToggle）。
 *  U61 轮曾把它换成 App 内气泡的文案、本组退回后台；**阶段 3（feature.md【newui】）已把
 *  浮窗入口重新接回这条系统悬浮窗线**，本组文案即当前生效文案（needPermission 是
 *  权限缺失时的提示，紧随其后弹的引导层见 NEW_UI_PLAYER_LRC_PERMISSION_ASK）。 */
export const NEW_UI_PLAYER_LRC_TOAST = {
  on: 'LRC 浮窗已开启 · 回到桌面查看',
  off: 'LRC 浮窗已关闭',
  noSong: '先在放一首歌 · 浮窗要显示它的歌词',
  needPermission: '开启歌词浮窗需要先在系统设置里允许悬浮窗权限',
} as const

/** 「LRC 浮窗」缺悬浮窗权限时的引导层（载体 = 共通件 ConfirmSheet，原型 #confirmSheet 同族）。
 *  语义逐条对齐旧 UI 那条授权流程（components/DesktopLyricEnable + src/lang/zh-cn.json）：
 *  正文 = `setting_lyric_desktop_permission_tip`（L318「…需要在系统权限设置中授予 … 显示悬浮窗口的
 *  权限才能使用，是否去相关界面授予该权限？」），右键 = `agree_go`「去开启」（L4），
 *  左键 = `disagree`「我就不」（L45）；旧句里的旧产品名按新 UI 品牌名落（NEW_UI_APP_NAME）。
 *  授权动作本身仍走旧 UI 既有的两条 core 函数，不另写机制。 */
export const NEW_UI_PLAYER_LRC_PERMISSION_ASK = {
  title: '要给歌词浮窗开权限吗',
  body: `歌词浮窗需要在系统权限设置中授予 ${NEW_UI_APP_NAME} 显示悬浮窗口的权限才能使用 · 是否去相关界面授予该权限`,
  okLabel: '去开启',
  cancelLabel: '我就不',
} as const

/** 「LRC 浮窗」App 内气泡的开关反馈（U61 轮落地；原型 app.js toggleFloat L1900-1905）。
 *  阶段 3 换线记录：播放页工具行浮窗钮（#btnFloat）已改回系统级悬浮窗（core/desktopLyric），
 *  App 内那条线（hooks/useLrcFloat + screens/Main/LrcFloatDock）整体拆除；本组文案与下面的
 *  关闭钮 aria 只服务于原型视觉留存件 components/LrcFloat（暂无宿主，等原型口径回来再用）。 */
export const NEW_UI_PLAYER_LRC_FLOAT_TOAST = {
  on: 'LRC 浮窗已开启 · 可拖动，进入播放页时自动隐藏',
  off: 'LRC 浮窗已关闭',
} as const

/** 气泡关闭钮 aria（原型 parts/player/lrc-float.html L13 `aria-label="关闭浮窗"`，逐字） */
export const NEW_UI_PLAYER_LRC_FLOAT_CLOSE_ARIA = '关闭浮窗'

/** 收藏开关反馈（原型「已收藏到「我喜欢」/ 已取消收藏」） */
export const NEW_UI_PLAYER_FAV_TOAST = {
  added: '已收藏到「我喜欢」',
  removed: '已取消收藏',
} as const
