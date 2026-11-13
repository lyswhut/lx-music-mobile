import { Platform } from 'react-native'

/**
 * 等宽字族（原型 `ui-monospace` 那一族的平台近似，唯一出处）。
 *
 * 原型里凡是「标识符 / 数字要对齐」的位置都写了 `font-family: ui-monospace, ...`：
 * `code`（styles.css L63）、`.song-row .rank`（L297）、`.or-body b small`（L863）、
 * `#plIdSamples .chip b`（L921）、`.sw`（L982）、`.vb-note`（L1009）。
 * RN 没有 `ui-monospace` 这个族名，只能按平台各取一档：
 * - iOS：系统自带的等宽字体真名是 `Menlo`（`ui-monospace` 在 iOS 上解析到的就是它）。
 * - Android：走 framework 的 `monospace`（Droid Sans Mono），它不是内置字体文件而是系统族名，
 *   因此不需要往工程里塞 ttf。
 * 取不到时两端都退回各自默认字体，不会出现「字形缺失变豆腐块」。
 *
 * 新代码请从这里取，不要再在组件里各自 `Platform.select` 一份。
 */
export const MONO_FONT_FAMILY = Platform.select({ ios: 'Menlo', default: 'monospace' })
