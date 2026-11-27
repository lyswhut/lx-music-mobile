import { lerpColor } from '@/plugins/lyric'

export interface WordLyricColorItem {
  id: string
  color: string // 'theme' 表示跟随主题色，其余为十六进制颜色值
}

// 逐字歌词亮部（已唱部分）预设色板，'theme' 为首项表示跟随当前主题色
export const WORD_LYRIC_COLOR_LIST: WordLyricColorItem[] = [
  { id: 'theme', color: 'theme' },
  { id: 'white', color: '#ffffff' },
  { id: 'yellow', color: '#ffd54d' },
  { id: 'mint', color: '#4fe3b0' },
  { id: 'blue', color: '#5cb8ff' },
  { id: 'purple', color: '#b49dff' },
  { id: 'pink', color: '#ff9dbe' },
  { id: 'orange', color: '#ffb86b' },
  { id: 'red', color: '#ff6b6b' },
]

/**
 * 将色板 id 解析为实际颜色：'theme' 或未知 id 回退为主题色
 */
export const resolveWordLyricColor = (id: string, themePrimary: string): string => {
  if (id == 'theme') return themePrimary
  const item = WORD_LYRIC_COLOR_LIST.find(i => i.id == id)
  return item && item.color != 'theme' ? item.color : themePrimary
}

/**
 * 亮度调整：percent > 100 时按比例向白色提亮，< 100 时向黑色压暗，100 为原色
 */
export const adjustColorBrightness = (color: string, percent: number): string => {
  if (percent == 100) return color
  const t = (percent - 100) / 100
  return t > 0 ? lerpColor(color, '#ffffff', t) : lerpColor(color, '#000000', -t)
}

/**
 * 由用户设置计算逐字歌词的已唱/未唱颜色
 * @param colorSetting 亮部颜色 id（'theme' 或色板 id）
 * @param brightness 亮度百分比（100 为原色，大于 100 提亮，小于 100 压暗）
 * @param contrast 对比度百分比（0=未唱色与亮部同色，100=未唱色为中性灰）
 * @param themePrimary 主题主色（colorSetting 为 'theme' 时使用）
 * @param themeGray 主题灰阶色（未唱色对比混合的目标色）
 */
export const getWordLyricColors = (
  colorSetting: string,
  brightness: number,
  contrast: number,
  themePrimary: string,
  themeGray: string,
): { playedColor: string, waitColor: string } => {
  const baseColor = resolveWordLyricColor(colorSetting, themePrimary)
  const playedColor = adjustColorBrightness(baseColor, brightness)
  const ratio = Math.max(0, Math.min(1, contrast / 100))
  const waitColor = ratio == 0 ? playedColor : lerpColor(playedColor, themeGray, ratio)
  return { playedColor, waitColor }
}
