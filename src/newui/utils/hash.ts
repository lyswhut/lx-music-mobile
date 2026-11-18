/**
 * 原型 data.js 的字符串散列：h = h * 31 + charCode，末尾无符号化。
 * 用于「种子 → 封面色板 / 纹理变体」的稳定映射：同一首歌每次渲染得到同一张封面。
 */
export const hashString = (value: string): number => {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}
