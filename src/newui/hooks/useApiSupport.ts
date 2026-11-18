import { assertApiSupport } from '@/utils/tools'

import { useApiSourceTick } from './useApiSourceTick'

/**
 * 当前音源能否取到某平台歌曲的地址。
 * 判定逻辑复用既有 `@/utils/tools` 的 assertApiSupport（读 global.lx.qualityList），
 * 这里只补一件事：订阅 state_event 的 apiSourceUpdated，换音源后让调用方重渲染
 * （订阅脉冲抽到 useApiSourceTick，音源浮层的档位 memo 同源共用）。
 *
 * @returns (source) => boolean，可在列表渲染中逐首调用（不是 hook，不受循环调用限制）
 */
export const useApiSupport = () => {
  useApiSourceTick()
  return assertApiSupport
}
