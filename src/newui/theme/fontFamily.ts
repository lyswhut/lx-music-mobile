import { Platform } from 'react-native'

/**
 * 等宽字族的唯一出处（ui-monospace 的平台近似）：iOS 用 Menlo，Android 用系统族名
 * monospace，均无需内置字体；新代码从这里取，不要各自 Platform.select。
 */
export const MONO_FONT_FAMILY = Platform.select({ ios: 'Menlo', default: 'monospace' })
