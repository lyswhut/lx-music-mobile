/**
 * 颜色计算工具（新 UI 专用）
 * 原型 styles.css 中使用了 color-mix 与平台色亮暗换算，
 * React Native 没有等价能力，这里用纯函数在 JS 侧预计算。
 */

const HEX_RXP = /^#([0-9a-f]{6})$/i

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

interface Rgb {
  r: number
  g: number
  b: number
}

const parseHex = (hex: string): Rgb | null => {
  const match = HEX_RXP.exec(hex)
  if (match == null) return null
  const value = parseInt(match[1], 16)
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
  }
}

const toHex = ({ r, g, b }: Rgb): string =>
  `#${[r, g, b]
    .map(channel => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`
    .toUpperCase()

/**
 * 按倍率调整颜色明度（色相不变），用于平台主色的亮 / 暗两档。
 * 对应原型榜单卡：tint 亮 1.18× → 暗 0.52×。
 * 无法解析的输入原样返回，避免渲染层拿到非法色值。
 */
export const shade = (hex: string, factor: number): string => {
  const rgb = parseHex(hex)
  if (rgb == null) return hex
  return toHex({ r: rgb.r * factor, g: rgb.g * factor, b: rgb.b * factor })
}

/** 给颜色叠加透明度，等价于 CSS color-mix(in srgb, color N%, transparent)。 */
export const withAlpha = (hex: string, alpha: number): string => {
  const rgb = parseHex(hex)
  if (rgb == null) return hex
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`
}
