/**
 * 搜歌屏「搜过的词」数据适配层：读写 @/utils/data 的 `@search_history_list`（与旧 UI 同格存储）。
 * 不走 core/search 的 addHistoryWord——它受 `search.isShowHistorySearch` 开关约束（默认关），新 UI 无此开关。
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

/** 本次会话最后读到 / 写入的列表；null = 冷启动还没读过，用于同步渲染首帧，避免先闪空态。 */
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

/** 清空整区并写回空数组（重启不回魂），返回空列表 */
export const clearSearchHistory = async(): Promise<string[]> => {
  await saveSearchHistory([])
  cached = []
  return []
}
