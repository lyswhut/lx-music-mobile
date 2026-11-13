/**
 * 电台（播客）的三项本机状态。
 *
 * **这三样都不是那三条接口给的**（契约 7.6 末段 / index.html L758：分类目录没有总目录、
 * 订阅在用户账号侧、进度在播放器侧），所以一律是「这台设备自己的账」：
 * 读不到也不写回任何平台。
 *
 * 存储姿势照新 UI 既有判例（`src/newui/hooks/useNickName.ts`、`src/newui/utils/recentPlay.ts`）：
 * **新 UI 自持 AsyncStorage 键，不读也不改旧 store**（`src/store/`、`src/plugins/` 一概不碰）。
 * 与那两个文件同一套「模块级缓存 + 订阅集合 + 读一次」的做法——
 * 电台首页、详情屏、单集屏分属不同屏幕树，各自的 hook 必须看见同一份名单与进度。
 *
 * 与原型的一处必要出入（写在 `types.PodSubEntry` 里，这里只摘要）：
 * 原型 `LS.podSub` 存纯 id 数组（app.js L1787），因为原型手边有整张 mock 榜可查表补名字与封面；
 * 真实侧没有这张表，所以名单项存 id + 卡片快照四栏。原型这一版只有「取消收听」没有「加订阅」，
 * 暧昧从未暴露；本轮工单要「订阅增删」，才必须落快照。
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

import type { PodProgressEntry, PodSubEntry } from './types'

/** 订阅名单（原型 `LS.podSub`） */
const SUB_KEY = 'newui.podSub'
/** 单集收听进度（原型 `LS.podProgress`） */
const PROGRESS_KEY = 'newui.podProgress'
/** 搜过的词（原型 `LS.podSearchHistory`） */
const HISTORY_KEY = 'newui.podSearchHistory'

/** 进度留存条数（原型 `list.slice(0, 8)`，app.js L1793） */
const PROGRESS_MAX_ENTRIES = 8
/** 搜词留存条数（原型 `podSearchHistory` 定长 8，app.js L2075 / L2096） */
const HISTORY_MAX_WORDS = 8
/**
 * 剩余少于此秒数就不写（原型 `if (podNow && left > 20) podSaveProgress(...)`，app.js L2238）。
 * 听得只剩 20 秒以内等于听完，下次进来该走「播最新单集」那颗，不该挂着「还剩 0 分钟」。
 */
const PROGRESS_MIN_LEFT_SEC = 20

type Listener = () => void

let subs: PodSubEntry[] = []
let progress: PodProgressEntry[] = []
let history: string[] = []
let loadPromise: Promise<void> | null = null
const listeners = new Set<Listener>()

const notify = (): void => {
  for (const listener of [...listeners]) listener()
}

/* —— 落盘：写失败不影响本次会话（内存里已经改完），只影响下次冷启动 —— */
const persistSubs = (): void => {
  void AsyncStorage.setItem(SUB_KEY, JSON.stringify(subs)).catch(() => {})
}
const persistProgress = (): void => {
  void AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)).catch(() => {})
}
const persistHistory = (): void => {
  void AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history)).catch(() => {})
}

/* —— 读回校验：形状不对就当没有（旧存档 / 手改存储都不该把界面带崩） —— */

const sanitizeSubs = (raw: unknown): PodSubEntry[] => {
  if (!Array.isArray(raw)) return []
  const entries: PodSubEntry[] = []
  for (const item of raw) {
    if (item == null || typeof item !== 'object') continue
    const entry = item as Partial<PodSubEntry>
    if (typeof entry.id !== 'string' || entry.id.length === 0) continue
    // 快照四栏里只有名字是显示必需的，其余给空串即可（不能让一颗没有名字的卡上屏）
    entries.push({
      id: entry.id,
      name: typeof entry.name === 'string' ? entry.name : '',
      by: typeof entry.by === 'string' ? entry.by : '',
      artworkUrl: typeof entry.artworkUrl === 'string' ? entry.artworkUrl : '',
    })
  }
  return entries
}

const sanitizeProgress = (raw: unknown): PodProgressEntry[] => {
  if (!Array.isArray(raw)) return []
  const entries: PodProgressEntry[] = []
  for (const item of raw) {
    if (item == null || typeof item !== 'object') continue
    const entry = item as Partial<PodProgressEntry>
    if (typeof entry.id !== 'string' || entry.id.length === 0) continue
    if (typeof entry.idx !== 'number' || !Number.isFinite(entry.idx) || entry.idx < 0) continue
    if (typeof entry.left !== 'number' || !Number.isFinite(entry.left) || entry.left <= 0) continue
    entries.push({ id: entry.id, idx: Math.trunc(entry.idx), left: Math.trunc(entry.left) })
  }
  return entries.slice(0, PROGRESS_MAX_ENTRIES)
}

const sanitizeHistory = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return []
  const words: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const word = item.trim()
    if (word.length === 0 || words.includes(word)) continue
    words.push(word)
    if (words.length >= HISTORY_MAX_WORDS) break
  }
  return words
}

const parseJson = (raw: string | null): unknown => {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * 读盘（幂等）：多个屏幕各自挂载都调它，只有一次真实 multiGet。
 * 订阅者集合在有变化时统一 notify，晚挂载的屏直接读内存值。
 */
export const loadPodLocalState = async(): Promise<void> => {
  if (loadPromise) return loadPromise
  loadPromise = AsyncStorage.multiGet([SUB_KEY, PROGRESS_KEY, HISTORY_KEY])
    .then(pairs => {
      for (const [key, raw] of pairs) {
        const parsed = parseJson(raw)
        if (key === SUB_KEY) subs = sanitizeSubs(parsed)
        else if (key === PROGRESS_KEY) progress = sanitizeProgress(parsed)
        else if (key === HISTORY_KEY) history = sanitizeHistory(parsed)
      }
      notify()
    })
    .catch(() => {
      // 读失败视为三项全空：界面走各自空态，不重试不报错（本机状态本就没有「取不到」这说）
    })
  return loadPromise
}

/** 订阅三项本机状态的任何变化；返回退订。订阅即触发一次读盘（同 recentPlay 的姿势） */
export const subscribePodLocalState = (listener: Listener): (() => void) => {
  listeners.add(listener)
  void loadPodLocalState()
  return () => {
    listeners.delete(listener)
  }
}

/* ================= 一、订阅名单 newui.podSub ================= */

/** 名单快照（引用稳定：只有增删才换新数组，界面可直读） */
export const getPodSubs = (): PodSubEntry[] => subs

/** 这个节目在不在名单里 */
export const isPodSubscribed = (id: string): boolean => subs.some(entry => entry.id === id)

/**
 * 收进这台设备。同 id 再收一次只刷新快照（名字与封面会改版），顺序不动。
 * 原型没有这个入口（详情屏顶排那颗 #podSubBtn 本轮已撤），所以行为按最小合理口径定。
 * 现调用方：播客详情屏进层自动登记（打开过该节目 = 听过，用户定口径）——
 * 新收录的排最前，重复进入原地刷新、不重复登记也不打乱顺序。
 */
export const addPodSub = (entry: PodSubEntry): void => {
  if (!entry.id) return
  const index = subs.findIndex(item => item.id === entry.id)
  if (index >= 0) {
    const next = subs.slice()
    next[index] = entry
    subs = next
  } else {
    subs = [entry, ...subs]
  }
  persistSubs()
  notify()
}

/** 取消收听（原型 `unsubPod`，app.js L1844-1848）：只从本机移除，不写回任何平台 */
export const removePodSub = (id: string): void => {
  const next = subs.filter(entry => entry.id !== id)
  if (next.length === subs.length) return
  subs = next
  persistSubs()
  notify()
}

/** 开关式增删，返回改完后的状态（true = 已收进名单）。界面层只想要一颗钮时用它。 */
export const togglePodSub = (entry: PodSubEntry): boolean => {
  if (isPodSubscribed(entry.id)) {
    removePodSub(entry.id)
    return false
  }
  addPodSub(entry)
  return true
}

/* ================= 二、单集收听进度 newui.podProgress ================= */

/** 进度表快照（新记录在前，最多 8 条） */
export const getPodProgressEntries = (): PodProgressEntry[] => progress

/** 某个节目的进度；没听过就是 null（原型 `podProgressOf`，app.js L1789） */
export const getPodProgressOf = (id: string): PodProgressEntry | null =>
  progress.find(entry => entry.id === id) ?? null

/**
 * 关层时落「还剩多少」（原型 `podSaveProgress`，app.js L1790-1794 + 落盘点 L2238）。
 * 三条原型口径都在这里一次做完，界面层不必再判：
 * 1. `left` 单位秒，**≤20 秒不写**（听得只剩 20 秒以内算听完）；
 * 2. 同一个节目只留最近一条（先按 id 剔旧，再 unshift 新的）；
 * 3. 整表留存 8 条（`slice(0, 8)`）。
 * 注：原型把这个门放在调用点（closeEpisodeLayer），这里收到函数内部——
 * 界面层少判一次就少一个漏点（RN 侧系统返回键也得走同一条落盘，契约 7.3 ③ 特意点过）。
 */
export const savePodProgress = (id: string, idx: number, left: number): void => {
  if (!id) return
  if (!Number.isFinite(left) || left <= PROGRESS_MIN_LEFT_SEC) return
  const next = progress.filter(entry => entry.id !== id)
  next.unshift({ id, idx: Math.trunc(idx), left: Math.trunc(left) })
  progress = next.slice(0, PROGRESS_MAX_ENTRIES)
  persistProgress()
  notify()
}

/**
 * 把进度表**再写一次并等它落地**（远控 Stop / 退出应用之前用）。
 * `persistProgress()` 是发出去就不管的（写失败也不影响本次会话），但出口那条路径紧接着
 * 就会 `destroyPlayer()` + 退出进程，不 await 就可能连写请求一起没掉——所以这里单独给一个可等的口。
 */
export const flushPodProgress = async(): Promise<void> => {
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)).catch(() => {})
}

/* ================= 三、搜过的词 newui.podSearchHistory ================= */

/** 搜词快照（新词在前，最多 8 条） */
export const getPodSearchHistory = (): string[] => history

/**
 * 记一个搜过的词（原型 `rememberPodQuery`，app.js L2092-2099）：
 * trim 后为空的忽略；已有同词先摘掉再放最前（**重复搜同一个词不会长名单**）；定长 8。
 */
export const rememberPodSearch = (word: string): void => {
  const trimmed = word.trim()
  if (!trimmed) return
  const next = history.filter(item => item !== trimmed)
  next.unshift(trimmed)
  history = next.slice(0, HISTORY_MAX_WORDS)
  persistHistory()
  notify()
}

/** 清空搜过的词（原型 U83 idle 态那颗「清空」，app.js L2110）：内存与存储一起清 */
export const clearPodSearchHistory = (): void => {
  if (history.length === 0) return
  history = []
  persistHistory()
  notify()
}
