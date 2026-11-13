/**
 * 搜歌屏的「搜过的词」数据适配层（原型 `searchHistory` / `rememberQuery`，
 * app.js L3548-3571）。
 *
 * **为什么不用 `core/search/search` 的 `addHistoryWord`**：
 * 那一支的**第一行**就是 `if (!settingState.setting['search.isShowHistorySearch'] || !word) return`
 * （core/search/search.ts:25），而该项默认值是 `false`（config/defaultSetting.ts:62），
 * 旧 UI 里靠设置屏那枚「显示搜索历史」开关打开（screens/Home/Views/Search/BlankView，
 * Setting/settings/Search/IsShowHistorySearch.tsx）。新 UI 设置屏**没有这枚开关**，
 * 于是走旧入口的结果是：写词被静默吞掉 → 历史永不累积 → 空输入态的历史区永远是空的。
 *
 * **本轮判断：新 UI 去掉对 `search.isShowHistorySearch` 的依赖**（历史在新 UI 恒开）。
 * 尊重它的唯一后果是「新 UI 没有开关、默认关 ⇒ 这一区永久空」，与原型 `renderSearchIdle`
 * 的行为直接冲突，不可取。旧 UI 那枚开关的语义原样保留：它仍然管着旧 UI 的写与显示。
 *
 * 口径（逐条对原型）：
 * - 读取 = 本机存的那份（`@/utils/data` 的 `@search_history_list`，与旧 UI 同一格存储，
 *   所以老用户之前真的存过的词照旧看得见），去重、只留前 8 条（原型 `slice(0, 8)` L3548）。
 * - 记词 = 提到最前、同词去重、截到 8 条（原型 `unshift` + `splice` + `Math.min(length, 8)` L3565-3568），
 *   立刻写回本机（原型 `lsSave({ searchHistory })` L3570）。
 * - 清空 = 整区清并写回空数组（原型 L3590-3591「清空也写回本机，下次进来不该又冒出来」）。
 *
 * 只用 `@/utils/data` 的公开读写口，**不读不写 `src/store/`、不改 `src/core/`**：
 * 新 UI 自己读写同一份模块级缓存，屏内看到的一定是最新值，不会出现
 * 「写了却没读到」的两份缓存打架。
 */
import { NEW_UI_SEARCH_HISTORY_LIMIT } from '@/newui/const'
import { getSearchHistory, saveSearchHistory } from '@/utils/data'

/** 去空、去重（保留首次出现）、截到上限 */
const normalize = (list: readonly string[]): string[] => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of list) {
    const word = typeof raw === 'string' ? raw.trim() : ''
    if (!word || seen.has(word)) continue
    seen.add(word)
    out.push(word)
    if (out.length >= NEW_UI_SEARCH_HISTORY_LIMIT) break
  }
  return out
}

/**
 * 本次会话里最后一次读到 / 写入的列表。`null` = 还没读过（冷启动后的第一次进本屏）。
 * 用处只有一个：本屏是「push 即挂载」，用它可以拿同步初值渲染首帧——
 * 否则异步读落地前会先闪一下空态那行「还没有搜过的词」，对真存过词的设备是错话。
 */
let cached: string[] | null = null

/** 同步取本次会话的已知值（null = 还没读过，屏上历史区首帧先不渲染） */
export const peekSearchHistory = (): string[] | null => cached

/** 读本机存的搜过的词（新→旧，最多 8 条） */
export const readSearchHistory = async(): Promise<string[]> => {
  const list = normalize(await getSearchHistory())
  cached = list
  return list
}

/** 记一个词：提到最前、去重、截到 8 条，写回本机，返回写后的列表 */
export const rememberSearchWord = async(word: string): Promise<string[]> => {
  const target = word.trim()
  const list = await readSearchHistory()
  if (!target) return list
  const next = normalize([target, ...list])
  await saveSearchHistory(next)
  cached = next
  return next
}

/** 清空整区（写回空数组，重启不回魂），返回空列表 */
export const clearSearchHistory = async(): Promise<string[]> => {
  await saveSearchHistory([])
  cached = []
  return []
}
