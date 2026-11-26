/**
 * 音质档位可用性判定（纯函数，展示与写入口共用）。
 * 降档口径镜像播放核心 getPlayQuality：沿 flac24bit → flac → 320k 逐档下探，都够不着落 128k。
 */
import { TRY_QUALITYS_LIST } from '@/core/music/utils'

/** 该档位是否被当前音源声明支持 */
export const isQualitySupported = (
  supported: readonly LX.Quality[],
  quality: LX.Quality,
): boolean => supported.includes(quality)

/**
 * 算出「选某档后实际会播放的档位」（音源级近似）：只按音源声明的档位表判断，
 * 展示为「最多降到」语义，播放时只会同级或更高。
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
