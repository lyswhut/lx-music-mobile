import { mkdir, writeFile } from 'node:fs/promises'

const elements = []
const preview = []
let serial = 0
const escapeXml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const base = (type, x, y, width, height) => ({
  id: `lx-architecture-${++serial}`, type, x, y, width, height, angle: 0,
  strokeColor: '#263238', backgroundColor: 'transparent', fillStyle: 'solid',
  strokeWidth: 1.5, strokeStyle: 'solid', roughness: 0, opacity: 100,
  groupIds: [], frameId: null, roundness: null, seed: serial * 1009,
  version: 1, versionNonce: serial * 10007, isDeleted: false, boundElements: null,
  updated: 0, link: null, locked: false,
})
function text(value, x, y, fontSize = 21, color = '#263238') {
  const lines = value.split('\n')
  const width = Math.max(...lines.map(line => [...line].reduce((length, character) => length + (character.charCodeAt(0) > 255 ? fontSize : fontSize * 0.57), 0)))
  const height = lines.length * fontSize * 1.4
  elements.push({ ...base('text', x, y, width, height), strokeColor: color, fontSize,
    fontFamily: 2, text: value, originalText: value, textAlign: 'left', verticalAlign: 'top',
    containerId: null, autoResize: true, lineHeight: 1.4,
  })
  preview.push(`<text x="${x}" y="${y + fontSize}" font-size="${fontSize}" fill="${color}">${lines.map((line, index) => `<tspan x="${x}" dy="${index ? fontSize * 1.4 : 0}">${escapeXml(line)}</tspan>`).join('')}</text>`)
}
function box(x, y, width, height, title, body, color) {
  elements.push({ ...base('rectangle', x, y, width, height), backgroundColor: color, roundness: { type: 3 } })
  preview.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="${color}" stroke="#263238" stroke-width="1.5"/>`)
  text(title, x + 18, y + 12, 24)
  text(body, x + 18, y + 54, 20)
}
function arrow(startX, startY, endX, endY, label, labelX, labelY, color = '#455a64') {
  const originX = Math.min(startX, endX)
  const originY = Math.min(startY, endY)
  elements.push({ ...base('arrow', originX, originY, Math.abs(endX - startX), Math.abs(endY - startY)),
    strokeColor: color, points: [[startX - originX, startY - originY], [endX - originX, endY - originY]],
    startBinding: null, endBinding: null, startArrowhead: null, endArrowhead: 'arrow', elbowed: false,
  })
  preview.push(`<path d="M${startX},${startY} L${endX},${endY}" fill="none" stroke="${color}" stroke-width="2" marker-end="url(#arrow)"/>`)
  if (label) text(label, labelX, labelY, 18, color)
}

text('LX Music → HarmonyOS NEXT：实际项目架构与 RNOH 桥接原理', 35, 25, 32)
text('代码版本：feat/harmony-port · React Native 0.72.5 / RNOH 0.72.144 · C-API 架构', 35, 78, 20)
box(35, 130, 500, 170, '① 复用 React Native 业务', 'src/screens / components：搜索、歌单、歌词\nsrc/core / store：播放编排、状态、设置\nindex.harmony.js 注册 appKey = lxmusic', '#e3f2fd')
box(615, 130, 500, 170, '② Metro 选择 Harmony 实现', 'react-native → @react-native-oh/...\n优先 *.harmony.ts(x)；vendor 保留接口\n输出 bundle.harmony.js 与字体 / 图片', '#e3f2fd')
box(1195, 130, 500, 170, '③ Harmony 原生宿主启动', 'EntryAbility extends RNAbility\nIndex.ets：RNApp 加载 Metro / rawfile\ncreateRNPackages + C++ PackageProvider', '#e8f5e9')
arrow(535, 210, 615, 210)
arrow(1115, 210, 1195, 210)
text('A. 界面渲染链路：React 组件转换为鸿蒙原生节点', 35, 342, 26)
box(35, 400, 500, 190, 'React / JS 运行时', 'Root：react-navigation + Provider\nReact reconciliation → Fabric Shadow Tree\nYoga 计算布局；提交组件更新', '#e3f2fd')
box(615, 400, 500, 190, 'RNOH C++ / Fabric', 'ComponentDescriptor / ComponentInstance\nPackage 工厂创建对应原生组件\nC-API 主路径 + ArkTS 自定义组件', '#fff3e0')
box(1195, 400, 500, 190, 'ArkUI 与系统窗口', 'C-API 创建 / 更新 ArkUI Node\nscreens、slider 等通过 ArkTS builder\n原生触摸事件返回 RN 事件系统', '#e8f5e9')
arrow(535, 470, 615, 470, '渲染提交', 537, 431)
arrow(1115, 470, 1195, 470, '属性 / 布局', 1118, 431)
arrow(1445, 614, 285, 614, '事件 / 点击 → RNOH → JS 回调', 450, 625, '#2e7d32')
text('B. 原生能力调用：JSI + C++ 方法表 + ArkTS TurboModule', 35, 685, 26)
box(35, 745, 500, 195, 'JS 原生适配层', 'TurboModuleRegistry.getEnforcing(name)\n如 LXTrackPlayer / UtilsModule\n调用方法，等待 Promise；订阅 DeviceEventEmitter', '#e3f2fd')
box(615, 745, 500, 195, 'C++：LXMusicPackage.h', 'ArkTSTurboModule + methodMap_\nARK_ASYNC / SCHEDULE_METHOD_METADATA\n登记方法名、参数个数和调度方式', '#fff3e0')
box(1195, 745, 500, 195, 'ArkTS：LXMusicPackage.ets', '名称 → UITurboModule 工厂实例\nUtils / TrackPlayer / Crypto / UserApi\n调用 Harmony SDK：fs、AVPlayer、AVSession', '#e8f5e9')
arrow(535, 815, 615, 815, 'JSI 调用', 537, 775)
arrow(1115, 815, 1195, 815, 'RNOH 调度', 1116, 775)
arrow(1445, 965, 285, 965, 'Promise 结果 / 错误返回；原生 emitDeviceEvent → JS 监听器', 365, 977, '#2e7d32')
text('桥接例子：JS await player.play() → C++ 方法表 → TrackPlayerModule.ets → AVPlayer.play()', 35, 1027, 21)
text('关键约束：JS 名称、C++ 方法签名、ArkTS 工厂必须一致；JS 与 ArkTS 不是同一个运行时。', 35, 1063, 21)
text('C. 自定义音源：隔离脚本引擎与真实歌曲播放', 35, 1120, 26)
box(35, 1180, 500, 195, '音源与播放器业务', 'src/core/init/userApi：导入 / 初始化\ncore/music：音质选择、请求歌曲地址\n播放 URL → vendor TrackPlayer 适配层', '#e3f2fd')
box(615, 1180, 500, 195, 'Worker + QuickJS（独立引擎）', 'UserApiModule → ThreadWorker 消息\nUserApiWorker → NAPI liblx_user_api.so\nQuickJS 执行音源；HTTP / crypto 由宿主提供', '#fff3e0')
box(1195, 1180, 500, 195, '系统音频 / 文件能力', 'AVPlayer：音频解码与进度\nAVSession：媒体会话与遥控事件\n后台播放长时任务；fs / picker 保存文件', '#e8f5e9')
arrow(535, 1255, 615, 1255)
arrow(615, 1345, 535, 1345)
arrow(535, 1395, 1445, 1395, '取流得到 URL 后，独立通过播放器 TurboModule 播放', 600, 1406)
arrow(1445, 1395, 1445, 1375)
text('移植策略：业务接口尽量保持；平台依赖逐个替换或重写。QuickJS 音源脚本 ≠ RN JS 引擎。', 35, 1480, 21)
text('LXDownload：下载弹窗 → 同一 TurboModule 桥接 → HTTP 流 / fs → Download/LX Music', 35, 1516, 20)

await mkdir('docs/architecture', { recursive: true })
await writeFile('docs/architecture/harmony-rnoh.excalidraw', JSON.stringify({
  type: 'excalidraw', version: 2, source: 'https://excalidraw.com', elements,
  appState: { viewBackgroundColor: '#ffffff', gridSize: null }, files: {},
}, null, 2) + '\n')
await writeFile('docs/architecture/harmony-rnoh.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1730" height="1580" viewBox="0 0 1730 1580"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#455a64"/></marker></defs><rect width="1730" height="1580" fill="white"/><g font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif">${preview.join('\n')}</g></svg>\n`)
