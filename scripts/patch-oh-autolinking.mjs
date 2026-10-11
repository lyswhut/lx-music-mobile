/**
 * 为 OH-tpl 原生库补 harmony.autolinking 元数据。
 *
 * 背景:这批早期 @react-native-oh-tpl 库的 package.json 只有 harmony.alias,缺
 * harmony.autolinking(cmakeLibraryTargetName/ohPackageName),导致 RNOH hvigor
 * 0.2.0 autolinker 跳过它们、原生 TurboModule 不注册(运行期 getEnforcing 崩)。
 * 此脚本在 npm install 后(postinstall)补齐元数据,使 harmony 工程 autolink 能链接。
 *
 * 仅处理「有 C++ TurboModule/组件」的库;纯 ArkTS(fs)
 * 不在此列(它们的 ETS 注册由手写
 * harmony/entry/src/main/ets/RNOHPackagesFactory.ets 处理)。
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

// pkg 安装路径 -> { ohPackageName, cmakeLibraryTargetName }
const TARGETS = {
  '@react-native-clipboard/clipboard': { ohPackageName: '@react-native-oh-tpl/clipboard', cmakeLibraryTargetName: 'rnoh_clipboard' },
  '@react-native-async-storage/async-storage': { ohPackageName: '@react-native-oh-tpl/async-storage', cmakeLibraryTargetName: 'rnoh_async_storage' },
  'react-native-exception-handler': { ohPackageName: '@react-native-oh-tpl/react-native-exception-handler', cmakeLibraryTargetName: 'rnoh_exception_handler' },
  'react-native-quick-base64': { ohPackageName: '@react-native-oh-tpl/react-native-quick-base64', cmakeLibraryTargetName: 'rnoh_quick_base64' },
  'react-native-pager-view': { ohPackageName: '@react-native-oh-tpl/react-native-pager-view', cmakeLibraryTargetName: 'rnoh_pager_view' },
  'react-native-safe-area-context': { ohPackageName: '@react-native-oh-tpl/react-native-safe-area-context', cmakeLibraryTargetName: 'rnoh_safe_area' },
  '@react-native-community/slider': { ohPackageName: '@react-native-oh-tpl/slider', cmakeLibraryTargetName: 'rnoh_slider' },
}

let patched = 0
for (const [pkg, autolinking] of Object.entries(TARGETS)) {
  const p = path.join(ROOT, 'node_modules', pkg, 'package.json')
  if (!fs.existsSync(p)) {
    console.warn(`[patch-oh-autolinking] 跳过(未安装): ${pkg}`)
    continue
  }
  const d = JSON.parse(fs.readFileSync(p, 'utf-8'))
  d.harmony = d.harmony || {}
  d.harmony.autolinking = autolinking
  if (d.harmony.redirectInternalImports === undefined) d.harmony.redirectInternalImports = true
  fs.writeFileSync(p, JSON.stringify(d, null, 2))
  patched++
}
console.log(`[patch-oh-autolinking] 已补 autolinking 元数据: ${patched} 个库`)

const fsEntry = path.join(ROOT, 'node_modules/react-native-fs/FS.common.js')
if (fs.existsSync(fsEntry)) {
  const source = fs.readFileSync(fsEntry, 'utf8')
  const original = 'var RNFS_NativeEventEmitter = new NativeEventEmitter(RNFSManager);'
  const replacement = "var RNFS_NativeEventEmitter = require('react-native').Platform.OS === 'harmony' ? require('react-native').DeviceEventEmitter : new NativeEventEmitter(RNFSManager);"
  if (source.includes(original)) fs.writeFileSync(fsEntry, source.replace(original, replacement))
  else if (!source.includes(replacement)) throw new Error('Unsupported react-native-fs event emitter implementation')
}
