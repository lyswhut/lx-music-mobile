import { NativeModules } from 'react-native'

const { CoverColorModule } = NativeModules

const colorCache = new Map<string, string>()

/**
 * 获取图片主色调（十六进制），失败时返回空字符串
 */
export const getCoverColor = async (url: string, headers: Record<string, string> = {}): Promise<string> => {
  if (!url || !CoverColorModule) return ''
  const cached = colorCache.get(url)
  if (cached) return cached
  return CoverColorModule.getColor(url, headers).then((color: string) => {
    if (color) colorCache.set(url, color)
    return color
  }).catch(() => {
    // 取色失败时返回空字符串，由调用方回退到默认背景
    return ''
  })
}
