/** 字符串散列：h = h * 31 + charCode，末尾无符号化；用于种子 → 封面的稳定映射。 */
export const hashString = (value: string): number => {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}
