/**
 * 音质档位文案。
 * 键与项目 LX.Quality 一致；「标准 / HQ」沿用原型 data.js 的 QUALITY，
 * 「SQ / 24bit」沿用本项目既有的中文口径（src/lang/zh-cn.json 的 quality_*）。
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

/** 音源覆盖不到这个平台时的角标文案（原型 app.js：ok ? 音质 : '暂不能播'） */
export const UNPLAYABLE_LABEL = '暂不能播'
