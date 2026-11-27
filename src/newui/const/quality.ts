/**
 * 音质档位文案；键与项目 LX.Quality 一致。
 */

/** 各档位的展示文案 */
export const QUALITY_LABEL: Readonly<Record<LX.Quality, string>> = {
  '128k': '标准',
  '192k': '较高',
  '320k': 'HQ',
  flac: 'SQ',
  ape: 'SQ',
  flac24bit: '24bit',
  wav: '母带',
}

/** 音源覆盖不到这个平台时的角标文案 */
export const UNPLAYABLE_LABEL = '暂不能播'
