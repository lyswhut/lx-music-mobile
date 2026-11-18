/**
 * 音质档位可用性判定（纯函数，展示与写入口共用，不参与实际播放取址）。
 *
 * 降档口径完全镜像播放核心 `getPlayQuality`（src/core/music/utils.ts L218-230，只读引用）：
 * 核心在取播放地址时，从用户选的档位起沿 TRY_QUALITYS_LIST（flac24bit → flac → 320k）
 * 逐档下探，找到「曲目有该音质 且 当前音源声明支持」的第一档；都够不着就落到 128k。
 * 列表之外的档位（192k / ape / wav 这类名义档）核心不做高音质尝试，同样落 128k。
 * 本模块只是把这条既有口径在「只有音源级档位表、没有具体曲目」的场景下复述一遍
 * （supported 传 global.lx.qualityList 的并集），供浮层展示与写入收口使用；
 * 播放链路上的真实降档仍由核心自己完成，这里不新增任何兜底逻辑。
 */
import { TRY_QUALITYS_LIST } from '@/core/music/utils'

/** 该档位是否被当前音源声明支持 */
export const isQualitySupported = (
  supported: readonly LX.Quality[],
  quality: LX.Quality,
): boolean => supported.includes(quality)

/**
 * 按核心既有降档口径，算出「选某档后实际会播放的档位」（音源级近似）。
 * 与 getPlayQuality 的差别仅在：核心还要求曲目本身有该音质，这里没有曲目上下文，
 * 只按音源声明的档位表判断 —— 展示为「最多降到」语义，播放时只会同级或更高。
 */
export const getQualityFallback = (
  desired: LX.Quality,
  supported: readonly LX.Quality[],
): LX.Quality => {
  let fallback: LX.Quality = '128k'
  const idx = TRY_QUALITYS_LIST.indexOf(desired as typeof TRY_QUALITYS_LIST[number])
  if (idx >= 0) {
    const found = TRY_QUALITYS_LIST.slice(idx).find(q => supported.includes(q))
    if (found) fallback = found
  }
  return fallback
}
