import { assertApiSupport } from '@/utils/tools'

import { useApiSourceTick } from './useApiSourceTick'

/**
 * 当前音源能否取到某平台歌曲的地址：复用 assertApiSupport，并订阅 apiSourceUpdated
 * 让调用方在换音源后重渲染。
 * @returns (source) => boolean，可在列表渲染中逐首调用
 */
export const useApiSupport = () => {
  useApiSourceTick()
  return assertApiSupport
}
