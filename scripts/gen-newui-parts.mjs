#!/usr/bin/env node
/**
 * 把 new_design 原型拆成语义单元小件，产出 new_design/parts/。
 * 用法：node scripts/gen-newui-parts.mjs        （Node ≥ 18，本项目用 v22）
 * 输出：new_design/parts/**（派生文件，请勿手改）
 *
 * 铁律：
 * - 输入只读：new_design/index.html、styles.css、app.js（连同 data.js 四文件一字不改）。
 * - 无损切分：index.html 每个元素恰好归属一个件（拼回总数一致，零丢失零重复）；
 *   styles.css 每条规则恰好归属一个件（含 _base，规则数与选择器数都对得上）。
 *   校验不过直接报错退出，不开「其它/杂项」兜底桶。
 * - 归属表（PART_DEFS / ANCHORS / CSS_MATCHERS）是人工语义判定，源自
 *   src/newui/PROTOTYPE_INVENTORY.md 的双向对撞结论；原型若新增元素/规则而表未覆盖，
 *   脚本指名报错，逼着维护者显式补表——这正是「AI 没看全」的兜底。
 *
 * 边界规则（对撞报告第六节，照用）：
 * - U17 sheet：chrome 定义件 + 八个实例件继承；164dfa4 钉住规则(#playerSheet/#psBody)归 chrome。
 * - U28 rank-tabs 与 U35 cat-row 合并为一个「chip 行」件；CatStickerBar 是 RN 自造件不进 parts。
 * - 播放器舞台按原型单元写件（U52/U53/U54；U52 内含 disc 与舞台壳、lyric-wrap 挖出归 U53）。
 * - 查看器 chrome V1–V4 不是 App UI，不参与拆件，集中归 _chrome（壳层单列）。
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ND = resolve(root, 'new_design')
const OUT = join(ND, 'parts')
const errors = []
const fail = (msg) => { errors.push(msg) }

const htmlSrc = readFileSync(join(ND, 'index.html'), 'utf8')
const cssSrc = readFileSync(join(ND, 'styles.css'), 'utf8')
const jsSrc = readFileSync(join(ND, 'app.js'), 'utf8')

// ---------------------------------------------------------------------------
// 1. app.js：顶层符号 → 行号（件头注释里的出处；找不到即硬错误）
// ---------------------------------------------------------------------------
const jsSymbolLine = new Map()
jsSrc.split('\n').forEach((line, i) => {
  const m = line.match(/^(?:function|const|let|var)\s+([A-Za-z0-9_$]+)/)
  if (m && !jsSymbolLine.has(m[1])) jsSymbolLine.set(m[1], i + 1)
})
function resolveJs(symbols) {
  const out = []
  for (const s of symbols || []) {
    const ln = jsSymbolLine.get(s)
    if (ln == null) fail(`app.js 中找不到顶层符号 ${s}（件元数据过期，请核对原型后补表）`)
    else out.push(`${s} (L${ln})`)
  }
  return out
}

// ---------------------------------------------------------------------------
// 2. index.html：手写扫描器 → 元素树（精确行号 + 原文偏移）
// ---------------------------------------------------------------------------
const VOID_TAGS = new Set(['meta', 'link', 'br', 'img', 'input', 'hr', 'source', 'track', 'wbr', 'col', 'base', 'area'])
const LINE_STARTS = [0]
for (let i = 0; i < htmlSrc.length; i++) if (htmlSrc.charCodeAt(i) === 10) LINE_STARTS.push(i + 1)
function lineOf(offset) {
  let lo = 0, hi = LINE_STARTS.length - 1
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (LINE_STARTS[mid] <= offset) lo = mid; else hi = mid - 1 }
  return lo + 1
}
function colOf(offset) { return offset - LINE_STARTS[lineOf(offset) - 1] }

function findOpenTagEnd(from) {
  let i = from + 1, inQ = null
  for (; i < htmlSrc.length; i++) {
    const c = htmlSrc[i]
    if (inQ) { if (c === inQ) inQ = null; continue }
    if (c === '"' || c === "'") { inQ = c; continue }
    if (c === '>') return i + 1
  }
  fail('index.html 有开放标签找不到 >')
  return htmlSrc.length
}

const rootNodes = []
const allElements = []
const stack = []
{
  let cursor = 0
  while (cursor < htmlSrc.length) {
    const lt = htmlSrc.indexOf('<', cursor)
    if (lt < 0) break
    if (htmlSrc.startsWith('<!--', lt)) { cursor = htmlSrc.indexOf('-->', lt) + 3; continue }
    if (htmlSrc.startsWith('<!', lt)) { cursor = htmlSrc.indexOf('>', lt) + 1; continue }
    if (htmlSrc.startsWith('</', lt)) {
      const gt = htmlSrc.indexOf('>', lt)
      const tag = htmlSrc.slice(lt + 2, gt).trim()
      const top = stack.pop()
      if (!top || top.tag !== tag) fail(`index.html 标签不配对：L${lineOf(lt)} 的 </${tag}>（栈顶 ${top ? top.tag + '@L' + top.lineStart : '空'}）`)
      else { top.closeStart = lt; top.closeEnd = gt + 1 }
      cursor = gt + 1
      continue
    }
    const m = /^<([a-zA-Z][\w:-]*)/.exec(htmlSrc.slice(lt))
    if (!m) { cursor = lt + 1; continue }
    const tag = m[1]
    const gt = findOpenTagEnd(lt)
    const attrsRaw = htmlSrc.slice(lt + m[1].length + 1, gt - 1).trim()
    const selfClosed = htmlSrc.slice(lt, gt).trimEnd().endsWith('/>') || VOID_TAGS.has(tag)
    const idm = attrsRaw.match(/(?:^|\s)id="([^"]+)"/)
    const clm = attrsRaw.match(/(?:^|\s)class="([^"]+)"/)
    const node = {
      tag, attrsRaw,
      id: idm ? idm[1] : '',
      classes: clm ? clm[1].split(/\s+/).filter(Boolean) : [],
      openStart: lt, openEnd: gt, closeStart: selfClosed ? gt : -1, closeEnd: selfClosed ? gt : -1,
      lineStart: lineOf(lt),
      children: [],
      parent: stack.length ? stack[stack.length - 1] : null,
      selfClosed,
    }
    ;(stack.length ? stack[stack.length - 1].children : rootNodes).push(node)
    allElements.push(node)
    if (!selfClosed) stack.push(node)
    cursor = gt
  }
  if (stack.length) fail(`index.html 有 ${stack.length} 个未闭合元素：${stack.map((e) => e.tag + '@L' + e.lineStart).join(',')}`)
}
for (const el of allElements) el.lineEnd = lineOf(el.closeEnd - 1)

// ---------------------------------------------------------------------------
// 3. 件定义与元素归属锚点
// ---------------------------------------------------------------------------
// anchor 语法：tag:xxx / id:xxx / cls:xxx（class token 精确匹配）/ sec:parentId:n（该页内第 n 个 .section）
// mode：claim=锚点连未被子锚挖出的后代一起归本件；self=只归自身，子元素须各有归属
const ANCHORS = [
  ['tag:html', '_shell', 'self'], ['tag:head', '_shell', 'self'], ['tag:body', '_shell', 'self'],
  ['tag:meta', '_shell', 'claim'], ['tag:title', '_shell', 'claim'], ['tag:link', '_shell', 'claim'], ['tag:script', '_shell', 'claim'],
  ['cls:sprite', 'U23', 'claim'],
  ['cls:stage', '_chrome', 'self'], ['cls:viewer-bar', '_chrome', 'claim'],
  ['cls:phone', '_chrome', 'self'], ['cls:screen', '_chrome', 'self'],
  ['cls:island', '_chrome', 'claim'], ['cls:statusbar', '_chrome', 'claim'], ['cls:notes', '_chrome', 'claim'],
  ['cls:nav-brand', '_chrome', 'claim'], ['cls:nav-sep', '_chrome', 'claim'], ['cls:nav-label', '_chrome', 'claim'], ['cls:nav-foot', '_chrome', 'claim'],
  ['cls:topbar', 'U01', 'claim'],
  ['cls:viewport', '_shell', 'self'], ['cls:page', '_shell', 'self'],
  ['cls:banner-wrap', 'U24', 'claim'], ['cls:quick-row', 'U25', 'claim'],
  ['sec:page-home:0', 'U16', 'claim'], ['sec:page-home:1', 'U26', 'claim'], ['sec:page-home:2', 'U27', 'claim'],
  ['sec:page-home:3', 'U29', 'claim'], ['sec:page-home:4', 'U31', 'claim'],
  ['cls:rank-tabs', 'U28_35', 'claim'], ['cls:section-note', 'U32', 'claim'],
  ['cls:page-head', 'U34', 'claim'], ['cls:cat-row', 'U28_35', 'claim'],
  ['sec:page-playlist:0', 'U36', 'claim'], ['sec:page-playlist:1', 'U38', 'claim'], ['id:plPoolCount', 'U37', 'claim'],
  ['cls:rank-grid', 'U39', 'claim'],
  ['sec:page-mine:0', 'U45', 'claim'], ['sec:page-mine:1', 'U46', 'claim'], ['cls:empty-tip', 'U11', 'claim'],
  ['cls:mine-head', 'U42', 'claim'], ['cls:stat-row', 'U43', 'claim'], ['cls:fav-card', 'U44', 'claim'],
  ['cls:foot-note', 'U10', 'claim'],
  ['cls:set-hero', 'U48', 'claim'], ['id:setBody', 'U49', 'claim'],
  ['cls:minibar', 'U05', 'claim'], ['cls:tabbar', 'U04', 'claim'],
  ['cls:player-layer', 'UPLAYER_shell', 'self'],
  ['id:playerBg', 'U50', 'claim'], ['cls:player-top', 'U51', 'claim'],
  ['cls:player-stage', 'U52', 'claim'], ['cls:lyric-wrap', 'U53', 'claim'], ['cls:stage-dots', 'U54', 'claim'],
  ['cls:player-meta', 'U55', 'claim'], ['cls:player-source', 'U56', 'claim'],
  ['cls:seek-time', 'U58', 'claim'], ['cls:seek', 'U57', 'claim'],
  ['cls:player-controls', 'U59', 'claim'], ['cls:player-tools', 'U60', 'claim'],
  ['cls:lrc-float', 'U61', 'claim'],
  ['id:searchLayer', 'USEARCH_shell', 'self'], ['cls:sc-top', 'U62', 'claim'], ['id:searchBody', 'U64', 'claim'],
  ['id:plLayer', 'UDETAIL_shell', 'self'], ['id:plBg', 'U66', 'claim'], ['cls:pl-top', 'U67', 'claim'],
  ['id:plHero', 'U68', 'claim'], ['id:plActions', 'U69', 'claim'], ['id:plTracks', 'U70', 'claim'],
  // 电台（播客）四层：DOM 先后就是层级（首页 → 搜播客 → 详情 → 单集），与 #plLayer / #searchLayer 同一套右推层。
  // 层内的顶排 / 地区条 / 空态 / 页尾 / 进度 / 传输行由各自的原子件认走（.pl-top→U67、.cat-row→U28_35、
  // .empty-tip→U11、.foot-note→U10、.seek→U57、.player-controls→U59），本层 claim 只留壳与四族新骨架。
  ['id:radioLayer', 'U81', 'claim'], ['id:podcastSearchLayer', 'U83', 'claim'],
  ['id:podcastLayer', 'U82', 'claim'], ['id:episodeLayer', 'U84', 'claim'],
  // 已缓存（离线收听）：入口是「我的」那张合一卡（.fav-card.fav-duo，卡壳与斜线归 U44）的右半
  // #offlineCard——id 锚按 findAnchor 优先级盖过容器那条 cls:fav-card（U44）；左半 #favCard 没有自己的锚点，
  // 随容器一起归 U44。整屏右推层与电台四层同一套「上半固定 + 列表独立滚」，DOM 排在 #plLayer 之后、#radioLayer 之前。
  ['id:offlineCard', 'U86', 'claim'], ['id:offlineLayer', 'U86', 'claim'],
  ['id:sourceSheet', 'U72', 'claim'], ['id:plIdSheet', 'U73', 'claim'], ['id:createSheet', 'U74', 'claim'],
  ['id:plTagsSheet', 'U75', 'claim'], ['id:nameSheet', 'U47', 'claim'], ['id:moreSheet', 'U76', 'claim'],
  // 地区抽屉：电台（播客）那一屏用的浮层，DOM 排在 #plTagsSheet 之后、#moreSheet 之前（层级由先后决定）
  ['id:podRegionSheet', 'U85', 'claim'],
  ['id:playerSheet', 'U78_79', 'claim'], ['id:confirmSheet', 'U77', 'claim'],
  ['cls:toast', 'U06', 'claim'],
]
const anchorMap = new Map(ANCHORS.map(([spec, part, mode]) => [spec, [part, mode]]))
const secIndexCache = new Map()
for (const pageId of ['page-home', 'page-playlist', 'page-mine']) {
  const page = allElements.find((e) => e.id === pageId)
  if (!page) { fail(`index.html 找不到页面容器 #${pageId}`); continue }
  let n = 0
  for (const ch of page.children) if (ch.classes.includes('section')) secIndexCache.set(ch, n++)
}
function findAnchor(el, pageId) {
  if (el.classes.includes('section') && pageId && secIndexCache.has(el)) {
    const spec = `sec:${pageId}:${secIndexCache.get(el)}`
    if (anchorMap.has(spec)) return anchorMap.get(spec)
  }
  if (el.id && anchorMap.has(`id:${el.id}`)) return anchorMap.get(`id:${el.id}`)
  for (const c of el.classes) if (anchorMap.has(`cls:${c}`)) return anchorMap.get(`cls:${c}`)
  if (anchorMap.has(`tag:${el.tag}`)) return anchorMap.get(`tag:${el.tag}`)
  return null
}

// ---------------------------------------------------------------------------
// 4. 件元数据（PART_DEFS）
// ---------------------------------------------------------------------------
const P = (key, units, dir, file, title, extra = {}) => ({ key, units, dir, file, title, doc: false, js: [], ...extra })
const PART_DEFS = [
  P('_shell', '壳层', '', '_shell', '文档壳与页面骨架：html/head/body、#viewport、五只 .page（页面壳单列）。轻量宽屏档的两条壳级覆盖也落在本件：.wide .viewport 的 92/150 上下内衬、.wide .page 的 620 限宽居中（与外框同属壳层，RN 侧对应 PageViewport 的 contentContainerStyle + useWideLayout 的 wideContentMaxWidthOf）', { js: ['switchTab', 'PAGES', 'init', 'WIDE_MAX_W'], note: '页面本体就是这五只 .page 空壳，内容全部来自各单元件；五只页壳内的子件以「▸」占位注释互指。' }),
  P('_chrome', 'V1–V4', '', '_chrome', '查看器 chrome（非 App UI，不参与拆件）：设备切换条（竖屏 / 横屏 / Pad 三档 + 横屏档的窗口宽 700/890 钮）/ 手机外框（含 .phone.wide 的 890×400 与 .phone.pad 的 1180×820）/ 灵动岛 / 假状态栏 / Pad 侧栏专属节点 / 设计说明面板', { js: ['fitFrame', 'frameZoom', 'setDevice', 'FRAME', 'FRAME_NOTE', 'WIDE_TIERS', 'wideInnerW', 'wideTier', 'paintWide', 'clearWideFrame', 'setWideFrame', 'renderSwatches'], note: 'RN 有意不承接；本件仅作归属收容，避免混进语义单元（对撞报告 K 组）。宽度分档的判据（≥600 三列 / ≥840 四列）在本件的 js 符号 WIDE_TIERS 里，RN 侧下一轮照它改 useWideLayout。' }),
  P('_base', '公共底', '', '_base', '公共底：:root token 与 .phone.light 明亮档、reset、.ic、跨单元复用原子（.art/.chip/.icon-btn/.q-tag/.src-badge/.play-badge/.ghost-btn/.empty-tip/.section-*/.foot-note/.hot-words/分页状态行 .pl-status|.pl-end/右推层固定段壳 .pl-head（电台两层共用，见 U81/U82）/.player-crumb/@keyframes spin）', { cssOnly: true, js: ['applyTheme', 'setTheme'], note: '共享样式只在这里出现一份，各件不复刻。' }),

  P('U01', 'U01', 'common-control', 'topbar', '.topbar 吸顶头部（头像 / 搜索条 / 波纹钮；U03 告警点静态实例在本件内）', { js: [], jsNote: '事件接线在 init() 尾部（#searchBtn / #castBtn / #avatarBtn）；头像首字由 renderProfile() 写入。' }),
  P('U02', 'U02', 'common-control', 'icon-btn', '.icon-btn 圆钮原子（样式归 _base）', { doc: true, occCls: ['.icon-btn'] }),
  P('U03', 'U03', 'common-control', 'pulse-dot', '.pulse-dot 音源告警呼吸点（样式与 @keyframes pulse 归本件；静态元素在 U01 件内）', { doc: true, occCls: ['.pulse-dot'], js: ['renderNav'] }),
  P('U04', 'U04', 'common-control', 'tabbar', '.tabbar / .tab 底部 Tab（Pad 侧栏专属子节点归 _chrome）', { js: ['switchTab', 'renderNav', 'PAGES'] }),
  P('U05', 'U05', 'common-control', 'minibar', '.minibar 迷你播放条（完整条 / 贴边磁吸圆点两形态；含 .mini-progress、三颗 .mini-act、贴边态的 .mini-dock-mark 与 ::after 进度圆环）', { js: ['syncLists', 'miniPageSyncFor', 'syncMiniPage', 'paintProgress', 'bindMiniDock', 'paintMiniDock', 'miniBarClick', 'miniPullPx', 'MINI'] }),
  P('U06', 'U06', 'common-control', 'toast', '.toast 全站单例提示', { js: ['toast'] }),
  P('U07', 'U07', 'common-control', 'art', '.art 程序化封面原子（样式归 _base；由 app.js 生成，静态出现处见列表）', { doc: true, occCls: ['.art'], js: ['svgArt', 'svgAvatar', 'art', 'coverArt', 'faceArt', 'artIcon'] }),
  P('U08', 'U08', 'common-control', 'chip', '.chip 胶囊原子（样式归 _base）', { doc: true, occCls: ['.chip'] }),
  P('U09', 'U09', 'common-control', 'section', '.section / .section-head 区块壳（样式归 _base；静态 section 由各宿主件持有，此处列全）', { doc: true, occCls: ['.section'] }),
  P('U10', 'U10', 'common-control', 'foot-note', '.foot-note 页尾说明（五处静态实例全部归本件：四页 + 歌单详情层；样式归 _base；四页固定文案在件内。<em>电台首页与播客详情那两处页尾本轮撤掉</em>——屏上不解释接口口径，口径移到 index.html 说明节）', { js: ['PLD_FOOT'] }),
  P('U11', 'U11', 'common-control', 'empty-tip', '.empty-tip 空态（三处静态实例归本件；样式归 _base；固定文案在件内）', { js: ['PLD_EMPTY'] }),
  P('U12', 'U12', 'common-control', 'ghost-btn', '.ghost-btn 幽灵按钮原子（样式归 _base；「播放全部 N 首」文案见符号行）', { doc: true, occCls: ['.ghost-btn'], js: ['renderSongs', 'PLD_LABELS'] }),
  P('U13', 'U13', 'common-control', 'play-badge', '.play-badge 封面播放角标原子（样式归 _base）', { doc: true, occCls: ['.play-badge'] }),
  P('U14', 'U14', 'common-control', 'q-tag', '.q-tag 音质/时长小标签原子（样式归 _base；静态实例在 U51 件内）', { doc: true, occCls: ['.q-tag'] }),
  P('U15', 'U15', 'common-control', 'src-badge', '.src-badge 平台来源角标原子（样式归 _base；songRow 生成）', { doc: true, occCls: ['.src-badge'] }),
  P('U16', 'U16', 'common-control', 'hscroll-recent', '.hscroll + .recent-card 继续收听横滚（含区块壳与「清空记录」钮）；.hscroll 这条横滚壳现在有两处静态实例——本件的继续收听、电台首页的订阅那一区（件在 U81，行卡样式各归各家）', { js: ['renderRecent', 'recentIds', 'clearRecent', 'RECENT_LIMIT'] }),
  P('U17', 'U17', 'common-control', 'sheet-chrome', '.sheet 浮层 chrome 定义（mask/body/handle/title/sub + 164dfa4 钉住规则 #playerSheet .sheet-body/#psBody——钉住归 chrome，不归评论件；九实例件继承）；本轮口径定稿：九只面板共用 z-index:80，层级高低由 index.html 里的先后决定「同层里谁写在后面谁压在上面」，故第二层 #moreSheet、第三层 #confirmSheet 必须排在各面板之后（#moreSheet 已从 #playerSheet 之前挪到之后），收层一次只收最上面那一层；新增的 #podRegionSheet（地区抽屉，实例件 U85）排在 #plTagsSheet 之后、#moreSheet 之前', { doc: true, sheetIds: ['sourceSheet', 'plIdSheet', 'createSheet', 'plTagsSheet', 'podRegionSheet', 'nameSheet', 'moreSheet', 'playerSheet', 'confirmSheet'], js: ['openSheet', 'openLayer', 'closeLayer', 'closeTopSheet'] }),
  P('U18', 'U18', 'common-control', 'group-label', '.group-label 浮层分组标题（「已安装音源/音乐平台/音质/导入音源」等文案见符号行；.fold 变体 + .fold-toggle 折叠开关归本件，尾行 .fold-more 归 U19）', { doc: true, occCls: ['.group-label'], js: ['renderSheet', 'renderTagGroups', 'scriptFoldedNow'] }),
  P('U19', 'U19', 'common-control', 'opt-list', '.opt-list / .opt-row（radio/or-body/or-state/opt-ic）选项行族；行尾移除钮 .or-del 与列表尾「还有 N 个没显示」行 .fold-more 归本件', { doc: true, occCls: ['.opt-list'], js: ['renderSheet', 'actRow', 'openMore', 'scriptRow'] }),
  P('U20', 'U20', 'common-control', 'op-box', '.op-box / .op-input / .op-go / .op-err / .op-file 输入行族（.op-file 是本机导入那枚次级钮；打开/创建/保存钮文案在实例件内）', { doc: true, occCls: ['.op-box'], js: ['handleImport', 'handleImportFile', 'importGate', 'submitCreateList', 'saveNick', 'tryOpenByPid'] }),
  P('U21', 'U21', 'common-control', 'q-chips', '.q-chips（+ .q-note）chip 组行', { doc: true, occCls: ['.q-chips'], js: ['renderSheet', 'renderTimerSheet'] }),
  P('U22', 'U22', 'common-control', 'toggle', '.toggle / .sw-row 开关行唯一定义（静态元素在 sheets/player-sheet 件内；「等当前这首放完再停」文案见 renderTimerSheet）', { doc: true, occCls: ['.sw-row'], js: ['renderTimerSheet', 'setToggle'] }),
  P('U23', 'U23', 'common-control', 'sprite', 'SVG sprite（36 枚 symbol 全量归本件；RN 侧经 gen-newui-icons.mjs 生成 icons.ts，勿手改）', { js: ['setIcon'], jsNote: 'symbol 按名取用；本件与 RN 生成物 scripts/gen-newui-icons.mjs 同源。' }),
  P('U30', 'U30', 'common-control', 'eq-bars', '.sr-title .eq 播放中三柱均衡器（含 @keyframes eq；元素由 songRow 生成）', { doc: true, js: ['songRow'] }),
  P('U28_35', 'U28+U35', 'common-control', 'chip-row', 'chip 行：首页 .rank-tabs 与<em>一处</em> .cat-row(sticky)（歌单页分类条）合并为一件，不再拆细；歌单首位标签取 PL_TAG_REC「推荐」（交叉轴居中靠 _base .chip 的 line-height:1+justify-content:center）。<em>电台首页那条地区胶囊本轮撤掉</em>——地区改成抽屉（实例件 U85），这一屏不再出现 .cat-row。CatStickerBar 是 RN 为平台缺 sticky 自造的复制层，属实现税，不进原型件', { js: ['renderRankTabs', 'homeBoards', 'renderPlaylistPage', 'tagChip', 'plHotCats', 'PL_TAG_REC'] }),
  P('U34', 'U34', 'common-control', 'page-head', '.page-head 公共页头（歌单/排行/设定三页；含 .pl-open-btn「打开歌单」）', { js: ['renderPlaylistPage'] }),

  P('U24', 'U24', 'home', 'banner', '.banner-wrap 轮播两条（track/dots；b-tag、veil 由 renderBanners 生成）：一条音源公告、一条正在播放（有歌才出现）。<em>电台那一条本轮撤掉</em>——首页只留快捷入口那一格电台，同一屏不给三个入口指向同一层', { js: ['bannerItems', 'renderBanners', 'bannerPaint', 'startBannerCarousel', 'BANNER_ACTION'] }),
  P('U25', 'U25', 'home', 'quick-row', '.quick-row 快捷入口四宫格（每日推荐/排行榜/电台/我喜欢，QUICK 见 data.js）：<em>电台那一格现在是全站唯一的电台入口</em>，点它推入 U81 那一层', { js: ['renderQuick'] }),
  P('U26', 'U26', 'home', 'daily-card', '.daily-card 今日推荐卡（含区块壳）', { js: ['renderDaily', 'dailyPool', 'todayLabel'] }),
  P('U27', 'U27', 'home', 'pl-card', '.pl-grid / .pl-card 推荐歌单区块（首页那份；歌单页/我的页复用见 U38/U46）。轻量宽屏档在本件持有两条列数覆盖：.wide.wcols3 → 3 列（gap 16×14）、.wide.wcols4 → 4 列（gap 16×12），卡内字号与封面比例一律沿用手机竖屏那一套', { js: ['renderPlaylists', 'plCard'] }),
  P('U29', 'U29', 'home', 'song-list', '.song-list 热门单曲区块（section 壳 + ghost-btn + 列表壳；rank-tabs 子块挖出归 chip-row；songRow/src-badge/q-tag/play-badge 复用 _base 与内容件）；本轮 songRow() 多收第 5 参 scene——只有传 \'queue\' 时行内「⋯」给 U80 那一屏专属菜单，其余落点不传、菜单不变', { js: ['renderSongs', 'songRow', 'currentSongs', 'currentBoard', 'HOME_SONG_LIMIT'] }),
  P('U31', 'U31', 'home', 'artist-card', '.artist-card 热门歌手横滚（含区块壳；section-note 挖出归 U32）', { js: ['renderArtists', 'ARTIST_LIMIT'] }),
  P('U32', 'U32', 'home', 'section-note', '.section-note 区块说明灰字（RN 缺件·页面内联，本轮拆件头号转正候选）', { js: ['renderArtists'] }),
  // U33（首页电台区块 .radio-grid / .radio-card）本轮退役：首页只留快捷入口那一格电台，
  // 编号不回收；.wip-tag 样式本体挪到 U84（单集屏那枚「界面示意」本轮也撤了：样式留着备用，屏上已无实例）。

  P('U36', 'U36', 'playlist', 'my-pl', '.my-pl-row 我的歌单一排（含区块壳；空态挖出归 U11）', { js: ['renderPlaylistPage'] }),
  P('U37', 'U37', 'playlist', 'pl-count', '.pl-count「已列出 N / M 个」计数行（RN 缺件·内联，转正候选）', { js: ['paintPlPool'] }),
  P('U38', 'U38', 'playlist', 'pl-pool', '推荐池区块（.pl-grid 复用 U27；计数挖出归 U37、空态归 U11；分页状态行样式在 _base）', { js: ['paintPlPool', 'plPool', 'resetPlPool', 'loadPlPoolPage', 'plPoolStatusRow', 'PL_POOL_SIZE'] }),

  P('U39', 'U39', 'rank', 'rank-grid', '.rank-grid / .rk-card（rk-emblem/rk-name/rk-sub）榜单卡网格；卡由 rankCard() 生成。轻量宽屏档在本件同样持有两条列数覆盖：.wide.wcols3 → 3 列（gap 16×14）、.wide.wcols4 → 4 列（gap 16×12）；组头 .rank-group 与分页状态行仍是 grid-column:1/-1，不跟着摊列', { js: ['renderRankPage', 'rankCard', 'paintRankGrid', 'rankView', 'RANK_PAGE_SIZE'] }),
  P('U40', 'U40', 'rank', 'rank-group', '.rank-group 平台分段组头（「N 个榜 · 热歌/新歌/飙升在前」文案见符号行）', { doc: true, js: ['rankGroupHead'] }),
  P('U41', 'U41', 'rank', 'chart-art', 'chartArt 封面体系（两支脸，判据只有一条）：① <em>真实封面</em>为一路——榜名命 data.js 的 RANK_COVER_WORDS 判据表（rankCoverKey：名字大写后取第一条命中的词组，序为长词优先、同长按 外部授权榜 &gt; 语种 &gt; 地区 &gt; 曲风 &gt; 场景 &gt; 权益 &gt; 排名机制 &gt; 主打）就用 new_design/rank-covers/ 里那张同名图铺满（母图是 512×512 位图 PNG，入库不改像素；进包压成 q85 WebP，无损 17.03 MB 原样进包会把 APK 顶到 32 MB；图上不带字、四角方角）；卡上再压两行白字（<em>左上角</em>一块 <code>.rk-copy</code>，榜名最多两行、平台行紧跟其下），<em>文字一律白墨、不随图变色</em>，字底下<em>不叠遮罩</em>——原先那档压顶 <code>.rk-scrim</code>（<code>.7/.65</code>，由 scripts/rank-scrim-solver.html 对<em>出包这 49 张 WebP</em>逐像素反解、最低 5.04:1）2026-10-22 按用户口径整层撤掉：为过 4.5:1 把插画上半截糊成一块黑，遮得过了；现在可读性只剩两行字<em>紧贴字边的小投影</em>兜（<code>.rk-name</code> 与 <code>.rk-sub</code> 同一档 <code>0 1px 3px rgba(0,0,0,.55)</code>，此前那档 <code>0 2px 14px</code> 的大模糊在浅色封面上摊成一层灰纱，也一并撤了，平台行原先没投影这轮挂上）。② 判据命不中（146 个真榜名里 30 个）落<em>同一张兜底插画</em> <code>default.png</code>——它不在 manifest 的 48 条里、不参与判据，口味与这批一致（无字、方角、512×512），两支同一套画法与同一层文字。原先自画的「按榜名定色 + 按榜型挑单色线条符号」那一套底板（CHART_TINT／CHART_ACCENT／CHART_EMBLEM／chartTint／shadeHex）与这张真图摆在一起就是两种画风同台，已整族删除（kind 也随之从卡与头图的 props 里去掉）。两支都不随主题反相，底色统一 #0B1220（图未就位那一瞬的底色）。卡与详情头图共用同一颗 chartFace（它现在只管铺图，<code>opt.text</code> 那档遮罩开关随之去掉），头图那一份文字在图外', { doc: true, js: ['chartFace', 'chartArt', 'RANK_COVER_DIR', 'RANK_COVER_DEFAULT', 'rankCoverKey'] }),

  P('U42', 'U42', 'mine', 'mine-head', '.mine-head 个人头部（mh-*/头像大字；副行固定文案在件内）', { js: ['renderMinePage', 'renderProfile', 'nickInitial'] }),
  P('U43', 'U43', 'mine', 'stat-row', '.stat-row / .stat 本地统计三项（喜欢/歌单/最近播放）', { js: ['renderMinePage'] }),
  P('U44', 'U44', 'mine', 'fav-card', '.fav-card 入口卡家族：「我的」页这一处现在只有<em>一张整宽卡</em>（.fav-card.fav-duo）——中间一条斜线切成左右两半，左半 #favCard（我喜欢）归本件、右半 #offlineCard 是 U86 的入口（id 锚盖过容器那条 cls:fav-card）。卡壳（24 圆角 / margin-top / 深色基线的深梅紫→深靛紫渐变底，明亮档的浅粉→浅紫底与深字由 <em>_base</em> 的 <code>.phone.light .fav-card</code> 覆盖）与那道斜线（.fav-duo::after，4px 白色半透明实心线、rotate(18deg)，<em>不占 DOM 节点</em>）都在本件；两半的几何（.fc-half：flex 1 1 50% + 内部 grid「44px 图标框 / 名称 / 数字行」）也在本件，<em>两半共用同一套样式，U86 不再补一条右半专属</em>。本轮两处口径改动：① 卡里那颗直接开播的圆钮 .fc-go <em>整族撤掉</em>（半宽放不下，样式两条与元素一并删），开播回到各自屏里的「播放全部」；② 副行只留名词与数字（左「N 首」、右「N 首 · X MB」），原先「N 首 · 三首歌名」那串预览撤掉，空态两句原文照挂、p 单行省略。<em>斜线只是分隔，不是命中边界</em>：两半仍是左右两个矩形 role=button', { js: ['renderMinePage', 'refreshFavLayer', 'favPlaylist'] }),
  P('U45', 'U45', 'mine', 'song-list-compact', '.song-list.compact 最近播放区块（song-row 复用 U29；compact 变体样式归本件）', { js: ['renderMinePage'] }),
  P('U46', 'U46', 'mine', 'my-pl-mine', '我的歌单区（pl-card 复用 U27 + plCardMine；自建卡与收藏卡封面分叉见 listCover，收藏真卡由 plCardCollected 生成；「新建歌单」入口在区块壳内；空态挖出归 U11）', { js: ['plCardMine', 'plCardCollected', 'collectedPlaylists', 'listCover'] }),

  P('U48', 'U48', 'setting', 'set-hero', '.set-hero / .sh-sub 设定页说明头（RN 缺件·内联，转正候选；副句文案见 renderSettings）', { js: ['renderSettings'] }),
  P('U49', 'U49', 'setting', 'settings-group', '.set-group / .set-list / .set-row / .set-ic / st-l / st-r 设定分组行族（组由 renderSettings() 灌入 #setBody）', { js: ['renderSettings', 'setGroup', 'setRow', 'setToggle', 'THEME_ICON', 'setInfo'] }),

  P('UPLAYER_shell', '播放页壳', 'player', '_layer', 'player-layer 壳层（推入定位与 .player-layer>* 层序；子块各有归属件，本件只持有壳元素本身）', { js: ['player'], note: 'RN 侧舞台拆三件是 pager 手势落地方式，不写回原型件。' }),
  P('U50', 'U50', 'player', 'player-bg', '.player-bg 氛围层（blur70+saturate150；RN 缺件·内联 LinearGradient，转正候选）', { js: ['paintPlayer'] }),
  P('U51', 'U51', 'player', 'player-top', '.player-top + .player-crumb 顶排（RN 缺件·内联，转正候选；.player-crumb 样式在 _base——U51/U67 两处共用）', { js: ['paintPlayer'] }),
  P('U52', 'U52', 'player', 'stage', '.player-stage / .disc-wrap / .disc 唱片舞台（按原型单元写件；lyric-wrap 挖出归 U53）', { js: ['bindStageSwipe', 'swipeDir', 'SWIPE_MIN_DX', 'SWIPE_SLOPE'] }),
  P('U53', 'U53', 'player', 'lyric', '.lyric-wrap/.lyric-scroll/.ln/.ln-note/.ln-empty 歌词层（「这首歌暂时没有歌词…」文案见符号行）', { js: ['renderLyric', 'syncLyric', 'setLyric', 'hasLyric'] }),
  P('U54', 'U54', 'player', 'stage-dots', '.stage-dots 舞台指示点（左右滑手势唯一的可见提示）', { js: ['bindStageSwipe', 'setLyric'] }),
  P('U55', 'U55', 'player', 'player-meta', '.player-meta（player-info / .pc.fav 收藏钮；RN 缺件·内联，转正候选）', { js: ['paintFav', 'toggleFav'] }),
  P('U56', 'U56', 'player', 'player-source', '.player-source 平台+音质文本行（RN 缺件·内联，转正候选）', { js: ['paintPlayer', 'qLabel'] }),
  P('U57', 'U57', 'player', 'seek', '.seek 进度条（拖动即定位，拖动期间关 transition）', { js: ['seekTo', 'tick', 'bindDragX'] }),
  P('U58', 'U58', 'player', 'seek-time', '.seek-time 起止时间行（RN 缺件·内联，转正候选）', { js: ['paintProgress', 'fmt'] }),
  P('U59', 'U59', 'player', 'player-controls', '.player-controls / .pc 主传输行三颗（循环五态文案见 LOOP_* 行）', { js: ['step', 'toggle', 'LOOP_ORDER', 'LOOP_ICON', 'LOOP_NAME', 'paintLoop'] }),
  P('U60', 'U60', 'player', 'player-tools', '.player-tools / .pt-btn 次级工具行五颗（定时/循环/浮窗/评论/播放列表；浮窗本体在 U61、播放列表面板本体在 U80，两件对读防「钮有着落、本体悬空」）；第 5 颗 #btnQueue 图标复用 sprite 现成的 i-list 不新增 symbol，屏内不加文字，条数写在 aria-label（`播放列表 · 共 N 首`，由 paintQueueBtn 回写）', { js: ['paintTimerTag', 'cycleLoop', 'toggleFloat', 'setIcon', 'paintQueueBtn'] }),
  P('U61', 'U61', 'player', 'lrc-float', '.lrc-float 歌词悬浮窗（可拖动气泡）', { js: ['syncFloat', 'paintFloatBtn', 'toggleFloat', 'bindFloatDrag'], warn: 'RN 未落地·功能级缺口（对撞报告 U61 实锤）；派单接件时按整件对照，勿再散着抄。' }),

  P('USEARCH_shell', '搜索层壳', 'search', '_layer', 'search-layer 壳层（复用 .pl-layer 推入基础样式，那份 CSS 归 songlist-detail/_layer.css——拆件在此点它）', { js: ['openSearch', 'closeSearch'] }),
  P('U62', 'U62', 'search', 'sc-top', '.sc-top / .sc-box / .sc-cancel 搜索头排（RN 缺件·内联，转正候选；placeholder「搜歌名、歌手、歌单」与「取消」在件内）', { js: ['openSearch'] }),
  P('U63', 'U63', 'search', 'sc-tabs', '.sc-tabs 单曲/歌单分段条（含命中数；scTabs() 生成）', { doc: true, js: ['scTabs'] }),
  P('U64', 'U64', 'search', 'sc-body', '#searchBody 滚动体 + .sc-label / .sc-clear（「搜索历史」「大家都在搜」由 renderSearchIdle() 生成，文案见符号行）', { js: ['renderSearchIdle', 'scWordRow', 'rememberQuery', 'searchHistory'] }),
  P('U65', 'U65', 'search', 'sc-result', '.sc-empty / .sc-hint 结果空态与提示族（「正在搜索…」「没找到…」文案见符号行；sheet 里的 .sc-hint 实例在宿主件内）', { doc: true, js: ['scEmpty', 'renderSearch', 'SEARCH_HOT_LIMIT'] }),

  P('UDETAIL_shell', '详情层壳', 'songlist-detail', '_layer', 'pl-layer 推入壳层（搜索层也复用这份基础样式，见 search/_layer 头注）', { js: ['openPlaylist', 'closePlLayer'] }),
  P('U66', 'U66', 'songlist-detail', 'pl-bg', '.pl-bg 封面氛围层（blur64+saturate150；RN 侧 CoverWash 是降级共通件）', { js: ['openPlaylist'] }),
  P('U67', 'U67', 'songlist-detail', 'pl-top', '.pl-top / .pl-crumb / .pl-fav-btn 顶排（RN 缺件·内联，转正候选；面包屑文案见 PLD_OWNER + plCrumbOf）：静态实例现在有四层共用同一份顶排——歌单详情、电台首页（右槽是搜节目那颗 #podSearchBtn）、播客详情、单集屏（后两层右槽不放钮）；左槽一律是返回 chevron，靠本件那条 :first-child 规则转 180°。顶排一律<em>不做 sticky、不吸顶</em>，但落法分两种：<em>歌单详情与单集屏</em>顶排仍在滚动容器里随整层滚；<em>电台首页与播客详情</em>本轮起顶排挂在固定段 .pl-head 里，根本不参与滚动（所以「全站右推层没有第二处吸顶顶栏、别造 sticky」那条旧口径本轮作废，两屏靠结构分段而不是 sticky）。<em>本轮起</em>电台两层那颗 crumb 回显<em>节目名</em>而非类别词，长名字只截断一行：两条 #podcastLayer / #episodeLayer 的 .player-crumb>span 截断规则随本件登记（管的就是四层共用的那颗 crumb，不塞进 radio/ 那两件）；flex 容器里的裸文字挂不出省略号，所以详情屏那颗的标记也改成 .player-crumb>span 这个形状——与播放页、单集屏同一判例。<em>2026-10-24 起这颗 crumb 的归属口径改了</em>：原来按「从哪个入口进来」（kind）取文案，收藏自平台的单子会被叫成「我的歌单 / 歌单」，真实侧还有一处叫成「自建歌单」；现在只认这份单子自己（data.js 的 origin 三档 + 收藏关系，判据 playlistOwnerOf，表 PLD_OWNER），与入口无关——同一张单子哪个入口进来都同名，收藏单额外带平台名（`收藏歌单 · 网易云`）。右上角那颗钮的能力判断（自建才给删除 / 收藏给移出收藏）也一并跟着 owner 走', { js: ['PLD_OWNER', 'playlistOwnerOf', 'plCrumbOf', 'togglePlFav'] }),
  P('U68', 'U68', 'songlist-detail', 'pl-hero', '.pl-hero 头图区（ph-body/ph-sub/ph-meta/sep；「N/M 首可播」等文案在 openPlaylist）', { js: ['openPlaylist', 'chartArt'] }),
  P('U69', 'U69', 'songlist-detail', 'pl-actions', '.pl-actions 播放全部 + 随机钮（RN 缺件·内联，转正候选；PLD_LABELS 文案见符号行；「播放全部」实心 .ghost-btn.solid 实例在 openPlaylist 内生成，样式本体在 _base）', { js: ['PLD_LABELS', 'openPlaylist'] }),
  P('U70', 'U70', 'songlist-detail', 'pl-tracks', '#plTracks 曲目表（song-list 复用 U29；分页状态行 .pl-status/.pl-end 样式在 _base——三页共用；PLD_STATUS 文案见符号行）；本轮起播那一列改由 plPlayableQueue() 出，顺手把「这一列是谁家的」标在数组上（queueOwner：本机一张单子的名字，其余 null），供 U80 的「移出」文案分叉', { js: ['renderPlTracks', 'plStatusRow', 'loadPlPage', 'plEndRow', 'PLD_STATUS', 'PLD_EMPTY', 'PL_PAGE_SIZE', 'plPlayableQueue'] }),

  P('U81', 'U81', 'radio', 'home', '电台首页（#radioLayer 右推层，DOM 排在 #plLayer 之后、#podcastSearchLayer 之前）：<em>订阅那一区</em>（.subs-block/.subs-head/.subs-card + 每颗右上角 .subs-x 取消收听 + .subs-empty 空态，横滚壳复用 U16 的 .hscroll；标题右侧只剩「N 个节目」这个数）→ <em>当前地区那一行</em>（.pod-region：左边回显区名，右边「更多地区」那颗开抽屉 U85；胶囊行与 LS.podRegion 已撤，默认区固定在 cn）→ <em>排行榜主视觉</em>（.pod-list/.pod-row/.pod-rank/.pod-body/.pod-name/.pod-by/.pod-open，行是 div[role=button]）。一次 10 个 + 距底 160px 触底续取 + .pl-status/.pl-end（样式在 _base），第 3 批故意先失败一次；换区与取不到那一区走同一条状态行（loadPodRegion / podRetryRow）。顶排下那句能力边界说明与页尾口径句（.foot-note 归 U10）本轮撤掉，口径一律写进 index.html 说明节。<em>滚动结构（本轮按指令改成上半固定 + 列表独立滚，上一轮「整层一张滚动面」那条结论作废）</em>：外层 <em>#radioLayer{padding:0;overflow:hidden}</em>（这条 ID 规则随本件登记）→ 固定段 <em>.pl-head</em>（跨件原子，登记在 _base；本屏装顶排 + 订阅那一区 + 当前地区那一行）→ 滚动段<em>就是 .pod-list 自己</em>（#radioLayer>.pod-list 上 flex:1;overflow-y:auto，判例是 .pad #plLayer 里 #plTracks 那一族，不再套一层壳）；.pl-status 与 .pl-end 由列表携带，跟着一起滚、留在列表尾，所以触底续取的 podChartScroll 换绑到 #podChartList（#podChartList 就是这一屏唯一的轴，距底 160px 不变），进层与换区都由 podChartAxis() 把这根轴归零。订阅区与顶排之间的呼吸走 .subs-block{margin-top:18px}（.pl-actions 那一档，原来是 2px，固定段里挨着顶栏太紧）；地区行与榜列之间 18（6 + 2 + 轴自身 padding-top 10）。订阅与收听进度<em>不是接口给的</em>，是本机状态（LS.podSub / LS.podProgress）', { js: ['openRadio', 'closeRadio', 'renderPodSub', 'podSubIds', 'podSaveSubs', 'unsubPod', 'renderPodRegion', 'podRegionLabel', 'POD_REGION_DEFAULT', 'podChartAxis', 'podChartOf', 'resetPodChart', 'podRow', 'podStatusRow', 'renderPodChart', 'podRetryRow', 'loadPodRegion', 'loadPodChartPage', 'podChartScroll', 'POD_TXT', 'podMin', 'podDate'] }),
  P('U82', 'U82', 'radio', 'detail', '播客详情层（#podcastLayer）：.pl-bg 氛围层 + .pl-hero/.pl-actions 复用 U68/U69（内容 openPodcast() 生成：节目名 / 作者 / 分类词 / 共 N 集 / 最新单集日期 / 上次听到——<em>没有简介位，接口不给</em>）+ .ep-list 这一批取回的单集（.ep-head 小标题只留「单集」两字、.ep-row 行 = 集名两行截断 + .ep-meta 日期·时长·本机进度 tag + .ep-text 有摘要才有，<em>整行可点、行内不放按钮</em>——.ep-play 与列表尾 #podEpFoot 那句人话终点行本轮一起撤掉，接口给多少集就列多少集，不分页也不写解释行）。顶排右侧那颗收听（#podSubBtn，含 .on 实心渐变与 paintPodSubBtn）也撤了：这一屏只留 hero 那一颗「继续播放」，代价是「收进这台设备」在原型里没有入口，待用户定。<em>滚动结构（本轮按指令改成上半固定 + 列表独立滚，上一轮「整层滚、hero 跟着走」那条核对结论作废）</em>：外层 <em>#podcastLayer{padding:0;overflow:hidden}</em>（这条 ID 规则随本件登记）→ 固定段 <em>.pl-head</em>（跨件原子，登记在 _base；本屏装顶排 + .pl-hero + .pl-actions + .ep-head，hero 与操作行进固定段后不再被层的 padding 撑出一段滚不掉的空白）→ 滚动段<em>就是 .ep-list 自己</em>（#podcastLayer>.ep-list 上 flex:1;overflow-y:auto，与 U81 那根轴同一条判例）。小标题「单集」因此<em>移出滚动轴</em>：静态节点 #podEpHead 挂在 .pl-head 里，文字仍由 openPodcast() 灌（POD_TXT.epHead），轴里只有 .ep-row；进层时 openPodcast() 把这根轴 scrollTop 归零；小标题与首行之间 18（4 + 8 + 轴自身 padding-top 6）。那颗 crumb 回显<em>节目名</em>（长名字只截断，规则随 U67 登记，选择器本轮跨 .pl-head 一级改成后代式），不再用「名字一长就退回类别词」那个做法', { js: ['openPodcast', 'epRow', 'closePodcastLayer', 'podNow', 'podProgress', 'podProgressOf', 'podSaveProgress'] }),
  P('U83', 'U83', 'radio', 'search', '搜播客层（#podcastSearchLayer，复用 .search-layer 与 U62 的 .sc-top，写法与 U64/U65 那一屏同口径）：回车才发、正在搜索…、命中行复用 U81 的 podRow、底部只留命中数「N 个节目」（原先那句「点进去看最近几集」顺带删了）；无输入时<em>只给本机搜过的词</em>（LS.podSearchHistory，可清空），那句能力说明整条撤掉——播客没有「热搜」这件事（三条接口都不给），也不需要向用户解释自己能干什么。<em>这一屏仍是分区滚</em>：头部固定（输入框要常驻）+ .sc-body 自己滚，与搜歌那一屏（U64/U65）同一判例，不是电台自成一格；<em>但「四层里唯一分区滚」那句本轮作废</em>——电台首页（U81）与播客详情（U82）本轮也改成上半固定 + 列表独立滚，只是那两屏照 .pl-* 这一族写（.pl-head + 列表自己那根轴），不借用本件的 .sc-* 语义；输入框占位与右上那颗的 aria-label 本轮按 Apple 用词收成「搜节目名或作者」/「搜节目」', { js: ['openPodSearch', 'closePodSearch', 'renderPodSearch', 'submitPodSearch', 'podHitsOf', 'podWords', 'rememberPodQuery', 'podSearchHistory', 'podSearchQ', 'podSearchLoading'] }),
  P('U84', 'U84', 'radio', 'episode', '单集屏（#episodeLayer，<em>只做界面</em>：这件事只写在 notes 与注释里，<em>屏上不挂任何角标</em>——原先那枚「界面示意」与把它摆进行内的 .epl-wip 覆盖规则本轮一并撤掉；样式本体 .wip-tag 仍随本件登记，留着备用，屏上已无实例）：.epl-head（.epl-cover + .epl-meta 集名/节目·日期）+ .epl-intro（:empty 时整行不占位，对应接口那一集摘要可缺席）+ .seek/.seek-time/.player-controls 复用 U57/U58/U59（后退 15 秒 · 播停 · 前进 30 秒）+ .group-label/.q-chips 倍速档（复用 U18/U21）；尾句「播到这里就停 · 没听完的位置会留在本机…」本轮撤掉，剩余秒数怎么留只写在说明节。它<em>不接歌曲那套取流</em>：本地计时走 epTick，关掉时 podSaveProgress 写本机。顶排同样随整层滚、不吸顶，<em>那颗 crumb 回显节目名</em>（Apple 的播放器位不写「单集」这种类别词；静态标记里原先那两字已清空，长名字截断规则随 U67 登记）', { js: ['openEpisode', 'closeEpisodeLayer', 'epToggle', 'epTick', 'epStop', 'epJump', 'paintEpisode', 'renderPodRates', 'bindEpisodeSeek', 'epState', 'EP_RATES', 'epSec'] }),
  P('U85', 'U85', 'sheets', 'region-sheet', 'podRegionSheet 地区抽屉实例件（chrome 见 U17；写法<em>对标 #sourceSheet / #plTagsSheet</em>，但<em>不写 .sheet-sub 那一行解说</em>——原先那句「选一个地区，名单跟着换。」本轮撤掉，屏上只剩 .sheet-title「收听地区」，槽位宁可空着；分组目录由 openPodRegionSheet() 灌入 #podRegionBody，分组小标题 .group-label 归 U18、选项行族 .opt-list/.opt-row/.radio 归 U19，选中态就是行首那颗实心圆）。清单是 data.js 的 POD_REGION_GROUPS（5 组 42 区，key 就是排行榜接口地址里那一格国家码）；点一行 = 收层 + 换区 + 把 U81 那根榜列轴归零 + 重取这一区（loadPodRegion 里先 podChartAxis().scrollTop = 0 再重铺）。归本件的样式 0 条：这一层不新开任何视觉', { js: ['openPodRegionSheet', 'podRegionRow', 'podRegionSheet'] }),
  P('U86', 'U86', 'mine', 'offline', '已缓存（离线收听）：「我的」页入口是那张合一卡（.fav-card.fav-duo，家族壳与斜线归 U44）的<em>右半 #offlineCard</em>——本轮起两半各占 50%、中间一道斜线分开（斜的是线，命中边界仍是矩形），左半是 U44 的「我喜欢」、右半进本件那一屏；两半共用 .fc-half 那套几何，本件<em>不补一条右半专属样式</em>。图标用新增的 <em>i-phone-solid</em>（实心 Material 版，44px 图标框；<em>单独新开、不改现有 i-phone</em>）；副行「N 首 · X MB」，空了整句换成空态文案（原文照挂，p 单行省略）；<em>整半开整屏</em>——原先那颗直接开播的圆钮 .fc-go 随「两张卡合一」一起撤了，开播只剩这一屏里那颗「播放全部」。整屏右推层 <em>#offlineLayer</em>（DOM 排在 #plLayer 之后、#radioLayer 之前）复用「上半固定 + 列表独立滚」那套，写法判例 #radioLayer：外层 {padding:0;overflow:hidden} 归本件、固定段 .pl-head 与顶排 .pl-top 是跨件原子（_base / U67）、滚动段就是列表本体 .off-list；操作行 .pl-actions 复用 U69、空态 .empty-tip 复用 U11）。<em>清单不是接口给的</em>：把「本机已知道的歌」（收藏 ∪ 最近播放 ∪ 自建与收藏歌单歌目，offlineKnownSongs）逐首过真实侧两关——musicUrl 本机映射逐键（键 = id_音质，src/utils/data.ts:351）+ isCached(url) 验字节（src/plugins/player/utils.ts:184）；data.js 的 LOCAL_CACHE_KEYS 就是过了两关的键的 mock。同一首存过几档取最高那档（PLAY_QUALITY_CHOICES 序）。行是 .song-row 原子族自造（offRow，判例 podRow）：<em>没有序号列</em>（存储键枚举的顺序说不清，不编排序）、不挂「⋯」（这一屏只有"听"一个意图）、不标灰；<em>行内 q-tag 读「存在哪一档」</em>——同一枚原子、与别的屏换了语义。屏上只留名词与数字：口径句 .off-lede + 「共 N 首 · 占用 X MB」.off-n（占用是本机缓存总量报数，含封面歌词，故意不是逐行加和——逐首大小真实侧给不出，行内就不装）。<em>这一屏不分页</em>：有限集一次铺完，没有 .pl-status、没有触底续取。「播放全部」交<em>整列</em>给播放器、不按当前音源的平台覆盖筛（缓存取流走本机映射、不叫音源，play() 因此多收第三个参数 fromCache，只有这一屏传）；空态时那颗钮整个撤掉（<em>这一屏的「播放全部」是这批歌唯一的开播位</em>——卡上那颗圆钮本轮随「两张卡合一」一起撤了）。<em>没有网络状态检测能力</em>：屏上不写「离线模式已开启」，「不联网也能播」是结果不是运行时状态。Esc 与返回钮同口径一次只收这一层；setDevice 换外形一起收。RN 落点与数据接入口径见 index.html 说明节「我的」', { js: ['OFF_EMPTY', 'OFF_LEDE', 'offlineKnownSongs', 'cachedQuality', 'offlineRows', 'offlineQueue', 'offRow', 'offlinePlayAll', 'renderOffline', 'openOffline', 'closeOffline', 'renderMinePage'] }),

  P('U72', 'U72', 'sheets', 'source-sheet', 'sourceSheet 音源浮层实例（chrome 见 U17；「音源只负责一件事…」sheetSub 与 q-note 三句由 renderSheet 生成，文案见符号行；含就绪置顶排序 sortedScripts、折叠开关 scriptFoldedNow/SCRIPT_FOLD_LIMIT、行尾移除 askRemoveScript/removeScript、在线+本机双路导入 importGate/receiveScript/handleImportFile）', { js: ['renderSheet', 'renderImportRow', 'handleImport', 'handleImportFile', 'importGate', 'receiveScript', 'scriptRow', 'askRemoveScript', 'removeScript', 'sortedScripts', 'scriptFoldedNow', 'SCRIPT_FOLD_LIMIT', 'SCRIPT_MAX', 'NO_SCRIPT'] }),
  P('U73', 'U73', 'sheets', 'plid-sheet', 'plIdSheet 打开歌单浮层实例（PLID 样例表与错误文案见符号行；本件持有「打开」按钮与三句固定提示）', { js: ['openPlIdSheet', 'PLID', 'pidOf', 'bareIdOf', 'renderPlIdPlats', 'renderPlIdSamples', 'plIdError'] }),
  P('U74', 'U74', 'sheets', 'create-sheet', 'createSheet 新建歌单浮层实例（CREATE_TXT 见符号行；本件持有「创建」与校验提示）', { js: ['openCreateSheet', 'submitCreateList', 'doCreate', 'CREATE_TXT', 'CREATE_NAME_MAX', 'createListError'] }),
  P('U75', 'U75', 'sheets', 'tags-sheet', 'plTagsSheet 全部分类浮层实例（分组由 renderTagGroups() 灌入；「正在从平台获取分类…」见符号行）', { js: ['openTagSheet', 'renderTagGroups', 'plGroups', 'PL_TAG_REC'] }),
  P('U47', 'U47', 'sheets', 'name-sheet', 'nameSheet 修改浮层实例（NICK_PICKS 见符号行；本件持有「想叫什么/保存/换个快的」与收尾提示全文）。<em>2026-10-24 起这一层管两件事</em>：昵称 + 头像——入口钮文案随之从「改昵称」改成「修改」。头像一行 .av-box（预览 .av-preview 64 圆 + 右侧两枚 .op-file 次级钮：选一张本机图片 / 改回昵称首字），选图走 .op-file 背后那个隐藏的 file input #avFile（与音源导入同一条路数），FileReader 读 → canvas 缩到 512 见方内 → JPEG 压一道 → 存进 echoisle.proto.v1 的 avatar 键；不选图 / 点了「改回昵称首字」就回落成昵称首字（nickInitial）。头像三处位点同源：顶栏圆 #topAvatar（U01）、我的页头部 #mineArt（U42）、本层预览 #avPreview，都由 paintAvatar() 写同一份 state.avatar', { js: ['openNameSheet', 'saveNick', 'NICK_PICKS', 'applyAvatarFile', 'resetAvatar', 'paintAvatar'] }),
  P('U76', 'U76', 'sheets', 'more-sheet', 'moreSheet 单曲操作面板实例（.more-song 头 + opt-list 动作；「收藏到「我喜欢」」等文案见 openMore；加入候选组头「加入自建歌单」与空态句见 MORE_TXT，候选名单即 addablePlaylists）；本轮两处改动：① songRow 多收第 5 参 scene，传 \'queue\' 时整份菜单换成 U80 那一屏专属的几项（openQueueMore），其余落点不传仍是这一份；② 上一轮往这份通用菜单里加的那条「从这次播放里移出」已整行收走，「下一曲播放」抽出为共享行 nextRow()（与 U80 同一族），且本件 DOM 已挪到 #playerSheet 之后以拿到更高层级', { js: ['openMore', 'actRow', 'moreSong', 'MORE_TXT', 'addablePlaylists', 'nextRow'] }),
  P('U78_79', 'U78+U79', 'sheets', 'player-sheet', '#playerSheet 播放页子面板宿主：定时 / 评论 / 播放列表三种实例共用这一只 DOM（内容件见 timer-sheet / comment-sheet / queue-sheet；钉住规则归 U17 chrome；openSheet(kind) 的 map 三档）', { js: ['openSheet', 'closeLayer'] }),
  P('U78', 'U78', 'sheets', 'timer-sheet', 'timer 浮层内容件（renderTimerSheet() 灌入 player-sheet；「不开启」「N 分钟」「等当前这首放完再停」见符号行；开关本体归 U22）', { doc: true, js: ['renderTimerSheet', 'paintTimerTag', 'sleepSub', 'stopAtEdge'] }),
  P('U79', 'U79', 'sheets', 'comment-sheet', 'comment 浮层内容件（renderCommentSheet()/cmtItem() 嵌套树灌入 player-sheet；cmt-total/cmt-item/cmt-reply/cmt-to 样式归本件；164dfa4：cmt-total 钉在 #psMeta、仅 #psBody 滚——钉住规则本体在 U17）', { doc: true, js: ['renderCommentSheet', 'paintComments', 'cmtItem', 'loadCmtPage', 'CMT_TXT', 'CMT_PAGE_SIZE', 'commentTotal'] }),
  P('U80', 'U80', 'sheets', 'queue-sheet', 'queue 播放列表面板内容件（#playerSheet 实例三，openSheet(\'queue\') 由 U60 那颗 #btnQueue 开）：一条按播放顺序平铺的列，不分段不分类——没有「正在播放 / 接下来 / 之前」三段，也没有五档循环模式各写的尾句说明；正在播的那首只用行内现成的 .song-row.playing 底色 + 歌名前 .eq 条纹，本件不为它新造任何样式；顶部只留 #psSub 一句「这次要播的一共 N 首 · 点一行就切过去听」，随机档只多一句 .q-note「随机是切歌那一刻才抽的 · 这一列只是可能被抽到的」，空态一句「当前没有播放中的歌曲」；行内「⋯」本屏专属：非当前行三项「听这一首 / 下一曲播放 / 这次不播这一首／从「X」移出」，正在出声那行只有「这首从头再放」；这一列不带榜单序号（#psBody .song-row .rank{display:none} 归本件）、不挂分页状态行', { doc: true, js: ['renderQueueSheet', 'QUEUE_TXT', 'openQueueMore', 'nextRow', 'queueOf', 'copyQueue', 'plPlayableQueue', 'refreshQueueUI', 'paintQueueBtn'], note: '标记全部由 renderQueueSheet() 运行时生成（行还是全站那一种 songRow，归 U29/U30），本件无静态壳；数据只有一份——queueOf()/state.queue 这一列 + 它自带的 queueOwner 标（来处 plPlayableQueue，见 U70），playList 内核那份 queue 不是 UI 数据源。就地重铺走 refreshQueueUI()：先存 #psBody.scrollTop 再重铺再回位；切档（cycleLoop）/切歌（syncLists、toggle）都点它。面板之上再叠行内「⋯」（U76）是本件的层级前提，见 U17 那条口径。' }),
  P('U77', 'U77', 'sheets', 'confirm-sheet', 'confirmSheet 二次确认浮层实例（.cf-actions/.cf-btn；「要执行这一步吗」默认文案见 askConfirm）', { js: ['askConfirm', 'askClearCache', 'askDeleteList'] }),
]
const partByKey = new Map(PART_DEFS.map((p) => [p.key, p]))
const partDirLabel = (p) => (p.dir ? p.dir + '/' : '') + p.file

// ---------------------------------------------------------------------------
// 5. 元素归属（DFS：内层锚点挖出外层件）
// ---------------------------------------------------------------------------
const owner = new Map()
function walkAssign(el, inherited, pageId) {
  const a = findAnchor(el, pageId)
  if (a) {
    if (!partByKey.has(a[0])) fail(`ANCHORS 引用了不存在的件 key：${a[0]}（index.html L${el.lineStart}）`)
    el._anchor = { part: a[0], mode: a[1] }
  }
  const cur = el._anchor || inherited
  if (!cur) fail(`index.html L${el.lineStart} <${el.tag}${el.id ? '#' + el.id : ''}> 无归属（请补 ANCHORS）`)
  owner.set(el, cur || { part: '_ERR', mode: 'claim' })
  const nextPage = el.id && el.id.startsWith('page-') ? el.id : pageId
  for (const ch of el.children) walkAssign(ch, cur, nextPage)
}
for (const r of rootNodes) walkAssign(r, null, null)

const partRoots = new Map(PART_DEFS.map((p) => [p.key, []]))
function collectRoots(el, parentPart) {
  if (el._anchor && el._anchor.part !== parentPart) {
    const arr = partRoots.get(el._anchor.part)
    if (!arr) fail(`件 key 未登记：${el._anchor.part}（index.html L${el.lineStart}）`)
    else arr.push(el)
  }
  for (const ch of el.children) collectRoots(ch, el._anchor ? el._anchor.part : parentPart)
}
for (const r of rootNodes) collectRoots(r, null)
const countOwned = (key) => allElements.reduce((a, e) => a + (owner.get(e).part === key ? 1 : 0), 0)

// ---------------------------------------------------------------------------
// 6. 元素序列化（原文切片 + 他件子树换占位注释）
// ---------------------------------------------------------------------------
function marker(el) {
  const p = partByKey.get(owner.get(el).part)
  return `<!-- ▸ ${partDirLabel(p)}.html —— ${p.units} · 源 index.html L${el.lineStart}-L${el.lineEnd} -->`
}
function renderClaim(el) {
  const carveRoots = []
  ;(function find(n) {
    for (const ch of n.children) {
      if (ch._anchor && ch._anchor.part !== owner.get(el).part) carveRoots.push(ch)
      else find(ch)
    }
  })(el)
  carveRoots.sort((a, b) => a.openStart - b.openStart)
  const chunks = []
  let pos = el.openStart
  for (const c of carveRoots) {
    chunks.push(htmlSrc.slice(pos, c.openStart))
    chunks.push(marker(c))
    pos = c.closeEnd
  }
  chunks.push(htmlSrc.slice(pos, el.closeEnd))
  const col = colOf(el.openStart)
  return chunks.join('').split('\n').map((ln, i) => (i === 0 ? ln : ln.startsWith(' '.repeat(col)) ? ln.slice(col) : ln)).join('\n')
}
function indentLines(text, pad) {
  return text.split('\n').map((l, i) => (i === 0 ? l : (l.trim() ? pad + l : l))).join('\n')
}
function renderSelf(el) {
  const ownPart = owner.get(el).part
  const lines = [htmlSrc.slice(el.openStart, el.openEnd)]
  for (const ch of el.children) {
    const a = ch._anchor
    if (a && a.part !== ownPart) lines.push('  ' + marker(ch))
    else if (a && a.mode === 'self') lines.push('  ' + indentLines(renderSelf(ch), '  '))
    else if (a) lines.push('  ' + indentLines(renderClaim(ch), '  '))
    else lines.push('  ' + indentLines(renderClaim(ch), '  '))
  }
  if (!el.selfClosed) lines.push(htmlSrc.slice(el.closeStart, el.closeEnd))
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// 7. styles.css：规则切分与归属
// ---------------------------------------------------------------------------
let mediaBlockCount = 0
function parseCss() {
  const rules = []
  let i = 0, line = 1
  const n = cssSrc.length
  const skipWs = () => {
    while (i < n) {
      if (cssSrc[i] === '\n') { line++; i++; continue }
      if (/\s/.test(cssSrc[i])) { i++; continue }
      if (cssSrc.startsWith('/*', i)) { const e = cssSrc.indexOf('*/', i); line += (cssSrc.slice(i, e).match(/\n/g) || []).length; i = e + 2; continue }
      break
    }
  }
  const readBlock = (from) => {
    let depth = 0
    for (; from < n; from++) {
      if (cssSrc[from] === '\n') line++
      if (cssSrc[from] === '{') depth++
      else if (cssSrc[from] === '}') { depth--; if (depth === 0) return from + 1 }
    }
    fail('styles.css 花括号不配对')
    return n
  }
  const parseLevel = (mediaParams) => {
    for (;;) {
      skipWs()
      if (i >= n) return
      if (cssSrc[i] === '}') { if (mediaParams) return; return }
      if (cssSrc.startsWith('@media', i)) {
        mediaBlockCount++
        const brace = cssSrc.indexOf('{', i)
        i = brace + 1
        parseLevel(cssSrc.slice(i, brace).trim() || '@media')
        skipWs()
        if (cssSrc[i] === '}') i++
        continue
      }
      if (cssSrc.startsWith('@keyframes', i)) {
        const startLine = line
        const brace = cssSrc.indexOf('{', i)
        const name = /@keyframes\s+([\w-]+)/.exec(cssSrc.slice(i, brace))[1]
        const end = readBlock(brace)
        rules.push({ sel: `@keyframes ${name}`, startLine, endLine: line, at: 'keyframes' })
        i = end
        continue
      }
      const brace = cssSrc.indexOf('{', i)
      if (brace < 0) return
      const selStartLine = line
      const sel = cssSrc.slice(i, brace).trim()
      line += (sel.match(/\n/g) || []).length
      i = brace + 1
      const end = readBlock(brace)
      rules.push({ sel, startLine: selStartLine, endLine: line, media: mediaParams || null })
      i = end
    }
  }
  parseLevel(null)
  return rules
}
const cssRules = parseCss()

const BOUND = ' \t>+~,:.([-['
function containsSel(sel, pat) {
  let from = 0
  for (;;) {
    const k = sel.indexOf(pat, from)
    if (k < 0) return false
    const before = k === 0 ? '' : sel[k - 1]
    const afterIdx = k + pat.length
    const after = afterIdx >= sel.length ? '' : sel[afterIdx]
    const okBefore = k === 0 || BOUND.includes(before)
    const okAfter = afterIdx >= sel.length || BOUND.includes(after) || after === '>'
    if (okBefore && okAfter && !sel.slice(0, k).includes('{')) return true
    from = k + 1
  }
}
const CSS_EXC = [
  [/^\.pl-grid>\.pl-status,\.rank-grid>\.pl-status$/, '_base'],
  [/^\.pl-grid>\.pl-end,\.rank-grid>\.pl-end$/, '_base'],
  [/^#psBody>\.q-chips$/, 'U78'],
  [/^\.player-layer>\.player-bg$/, 'U50'],
  [/^\.pl-layer>\.pl-bg$/, 'U66'],
  [/^\.art\.chart-art$/, 'U41'],
  [/^\.song-list\.compact/, 'U45'],
  [/^\.phone\.light/, '_base'],
  [/^\.sr-title \.eq/, 'U30'],
  [/^\.pc\.fav/, 'U55'],
  [/^#plIdSamples/, 'U73'],
  [/^\.sr-sub \.src-badge,\.sr-sub \.q-tag$/, '_base'],
  [/^\.opt-row\.on \.radio$/, 'U19'],
  [/^\.pl-layer \.empty-tip$/, 'U70'],
  [/^#moreActions \.group-label,#moreActions \.q-note$/, 'U76'],
  // 音源浮层两条 ID 限定实例规则（判例 #plIdSamples→U73）：#importFile 是隐藏的原生 file input，
  // #importHint 是导入进行时的回显间距，都只在 #sourceSheet 内出现，归实例件 U72。
  [/^#importFile$/, 'U72'],
  [/^#importHint$/, 'U72'],
  // 播放列表面板两条 ID 限定实例规则（同上判例，与既有的 #psBody>.q-chips→U78 同一族写法）：
  // 这两条都只在 renderQueueSheet() 铺出的那一列里生效（#psBody 里只有这一屏挂 .song-list/.song-row），
  // 若不指名会被 U17 的 '#psBody' 模式先吃掉（U17 是 chrome 定义件，不该持有实例专属规则）。
  [/^#psBody \.song-row \.rank$/, 'U80'],
  [/^#psBody \.song-list$/, 'U80'],
  // 头像图铺满那一条跨两个件（顶栏圆 U01 与我的页头部 U42 共用），按「跨件原子」定到 _base
  [/^\.avatar img,\.mh-art img$/, '_base'],
]
const CSS_MATCHERS = [
  ['_chrome', ['.pad ', '.phone.pad', 'body.pad', 'body.wide', '.phone.wide', '.stage', '.phone', '.screen', '.island', '.statusbar', '.sb-time', '.sb-right', '.sb-signal', '.sb-batt', '.viewer-bar', '.vb-label', '.vb-seg', '.vb-btn', '.vb-note', '.nav-brand', '.nav-sep', '.nav-label', '.nav-foot', '.notes', '.swatches', '.sw']],
  ['U01', ['.topbar', '.topbar-row', '.avatar-btn', '.avatar', '.searchbar']],
  ['U03', ['.pulse-dot']],
  ['U05', ['.minibar', '.mini-progress', '.mini-main', '.mini-art', '.mini-meta', '.mini-title', '.mini-sub', '.mini-act', '.mini-dock-mark']],
  ['U06', ['.toast']],
  ['U23', ['.sprite']],
  ['U16', ['.hscroll', '.recent-card']],
  ['U17', ['.sheet', '#playerSheet', '#psBody', '#psMeta']],
  ['U18', ['.group-label', '.fold-toggle']],
  // U33（首页电台区块）本轮退役：.radio-grid / .radio-card 样式随区块一起从 styles.css 删掉，
  // .wip-tag 挪到 U84（样式本体留着备用：单集屏那枚「界面示意」与它的 .epl-wip 覆盖规则本轮撤掉，屏上已无实例）。
  // .or-del：行尾移除钮（.opt-row 由 button 改 div[role=button] 后，这颗才是 button，与 .or-body/.or-state 同族）
  // .fold-more：opt-list 尾部「还有 N 个没显示」整行，与 .opt-row 同层级同职责
  ['U19', ['.opt-list', '.opt-row', '.radio', '.or-body', '.or-state', '.opt-ic', '.or-del', '.fold-more']],
  // .op-file：本机导入那枚次级钮，与 .op-box/.op-input/.op-go/.op-err 同为「输入行族」
  ['U20', ['.op-box', '.op-input', '.op-go', '.op-err', '.op-file']],
  ['U21', ['.q-chips', '.q-note']],
  ['U22', ['.sw-row', '.toggle']],
  ['U04', ['.tabbar', '.tab']],
  ['U28_35', ['.rank-tabs', '.cat-row']],
  ['U34', ['.page-head', '.page-title', '.pl-open-btn']],
  ['U24', ['.banner-wrap', '.banner-track', '.banner', '.banner-dots']],
  ['U25', ['.quick-row', '.quick']],
  ['U26', ['.daily-card']],
  ['U27', ['.pl-grid', '.pl-card']],
  ['U29', ['.song-list', '.song-row', '.sr-body', '.sr-title', '.sr-sub', '.sr-right', '.sr-dur']],
  ['U31', ['.artist-card']],
  ['U32', ['.section-note']],
  ['U36', ['.my-pl-row', '.my-pl']],
  ['U37', ['.pl-count']],
  ['U39', ['.rank-grid', '.rk-card', '.rk-emblem', '.rk-copy', '.rk-name', '.rk-sub']],
  ['U40', ['.rank-group']],
  // 头像一行（.av-box 家族，2026-10-24）：只出现在 #nameSheet 里，随修改浮层实例件 U47；
  // 图片铺满那一条是跨件原子（顶栏圆 U01 与我的页头部 U42 共用同一条规则），用 CSS_EXC 定到 _base
  ['U47', ['.av-box', '.av-preview', '.av-acts']],
  ['U42', ['.mine-head', '.mh-art', '.mh-body', '.mh-name', '.mh-sub', '.mh-edit']],
  ['U43', ['.stat-row', '.stat']],
  // .fav-duo / .fc-half：「我喜欢」与「已缓存」合一卡的壳与两半几何，全族样式都在 U44（右半不另开一套）
  ['U44', ['.fav-card', '.fav-duo', '.fc-half']],
  ['U48', ['.set-hero', '.sh-sub']],
  ['U49', ['.set-group', '.sg-label', '.set-list', '.set-row', '.set-ic', '.st-l', '.st-r']],
  ['UPLAYER_shell', ['.player-layer']],
  ['U50', ['.player-bg']],
  ['U51', ['.player-top', '#playerClose']],
  ['U52', ['.player-stage', '.disc-wrap', '.disc']],
  ['U53', ['.lyric-wrap', '.lyric-scroll', '.ln', '.ln-note', '.ln-empty']],
  ['U54', ['.stage-dots']],
  ['U55', ['.player-meta', '.player-info', '.player-artist']],
  ['U56', ['.player-source']],
  ['U58', ['.seek-time']],
  ['U57', ['.seek']],
  ['U59', ['.player-controls', '.pc']],
  ['U60', ['.player-tools', '.pt-btn']],
  ['U61', ['.lrc-float']],
  ['USEARCH_shell', ['.search-layer']],
  ['U62', ['.sc-top', '.sc-box', '.sc-input', '.sc-x', '.sc-cancel']],
  ['U63', ['.sc-tabs']],
  ['U64', ['.sc-body', '.sc-label', '.sc-clear']],
  ['U65', ['.sc-empty', '.sc-hint']],
  ['U67', ['.pl-top', '#plFavBtn']],
  ['U68', ['.pl-hero', '.ph-body', '.ph-sub', '.ph-meta']],
  ['U69', ['.pl-actions']],
  ['UDETAIL_shell', ['.pl-layer', '#plLayer']],
  ['U66', ['.pl-bg']],
  ['U76', ['.more-song']],
  ['U77', ['.cf-actions', '.cf-btn']],
  ['U79', ['.cmt-total', '.cmt-item', '.cmt-body', '.cmt-line', '.cmt-name', '.cmt-like', '.cmt-text', '.cmt-reply', '.cmt-to']],
  // 电台（播客）四族新骨架。放在 _base 之前：像 `.pod-row .art`、`.ep-play .ic` 这种「本件类 + 原子类」
  // 的组合选择器，matchOneSel 是先到先得，本件排在 _base 前才会归本件（与 U29 .song-row .art 同一判例）。
  // U83（搜播客）没有新增样式：那一屏全部复用 .sc-* 与 U81 的 podRow，所以不列条目。
  // 两层各自那条「外层定死 padding:0;overflow:hidden」按 ID 规则归本层（与 #psBody 归实例件同一判例）；
  // 共用的固定段壳 .pl-head 排在 _base，不塞进 radio/ 那两件（与 .pl-status|.pl-end 跨件原子同一条判例）。
  ['U81', ['#radioLayer', '.subs-block', '.subs-head', '.subs-card', '.sub-n', '.sub-l', '.subs-x', '.subs-wrap', '.subs-empty', '.pod-region', '.pod-list', '.pod-row', '.pod-rank', '.pod-body', '.pod-name', '.pod-by', '.pod-open']],
  ['U82', ['#podcastLayer', '.ep-list', '.ep-head', '.ep-row', '.ep-body', '.ep-title', '.ep-meta', '.ep-text']],
  ['U84', ['.wip-tag', '.epl-head', '.epl-cover', '.epl-meta', '.epl-by', '.epl-intro', '#episodeLayer']],
  // 已缓存（U86）：本屏新增样式只有口径段与列表轴；层壳那条 #offlineLayer{padding:0;overflow:hidden}
  // 按 ID 规则归本层（与 #radioLayer / #podcastLayer 同一判例）。.pad #offlineLayer 两条被 _chrome 的
  // 「.pad 」前缀先到先得，不用在此登记。入口那一半（#offlineCard）本轮起与左半共用 U44 的 .fc-half，
  // 本件不持有卡上任何一条样式。
  ['U86', ['.off-list', '.off-meta', '.off-n', '.off-lede', '#offlineLayer']],
  ['_shell', ['.viewport', '.page']],
  ['_base', [':root', '*', 'html', 'body', 'button', 'h1', 'h2', 'h3', 'p', 'code', '.ic', '.art', '.icon-btn', '.chip', '.q-tag', '.src-badge', '.play-badge', '.empty-tip', '.section', '.section-head', '.section-title', '.section-more', '.section-sub', '.foot-note', '.foot-mark', '.ghost-btn', '.hot-words', '.pl-status', '.pl-end', '.pl-head', '.player-crumb']],
]
const KF_PART = { spin: '_base', pulse: 'U03', eq: 'U30', pop: 'U55' }
function matchOneSel(s0) {
  for (const [part, pats] of CSS_MATCHERS) for (const pat of pats) {
    if (pat.endsWith(' ')) { if (s0.startsWith(pat)) return part; continue }
    if (containsSel(s0, pat)) return part
  }
  return null
}
function assignRule(rule) {
  if (rule.media) return '_chrome'
  if (rule.at === 'keyframes') {
    const name = rule.sel.replace('@keyframes ', '')
    if (!KF_PART[name]) fail(`styles.css L${rule.startLine} 出现未登记的 @keyframes ${name}，请在 KF_PART 补归属`)
    return KF_PART[name] || '_ERR'
  }
  for (const [re, part] of CSS_EXC) if (re.test(rule.sel)) return part
  const sels = rule.sel.split(/,(?![^(]*\))/).map((s) => s.trim())
  const hits = sels.map(matchOneSel)
  if (hits.some((h) => !h)) fail(`styles.css L${rule.startLine}「${sels[hits.findIndex((h) => !h)]}」无归属，请在 CSS_MATCHERS 补条目`)
  const uniq = new Set(hits.filter(Boolean))
  if (uniq.size > 1) fail(`styles.css L${rule.startLine} 多义：${rule.sel} → 命中 ${[...uniq].join(' / ')} 多个件，请用 CSS_EXC 定夺`)
  return hits[0] || '_ERR'
}
for (const r of cssRules) r.part = assignRule(r)
for (const r of cssRules) {
  if (!partByKey.has(r.part)) fail(`styles.css L${r.startLine} 归到了不存在的件 ${r.part}`)
}
const cssByPart = new Map()
for (const r of cssRules) {
  if (!cssByPart.has(r.part)) cssByPart.set(r.part, [])
  cssByPart.get(r.part).push(r)
}

// ---------------------------------------------------------------------------
// 8. 无损校验（断言不过就退出）
// ---------------------------------------------------------------------------
const htmlTotal = allElements.length
const htmlSum = PART_DEFS.reduce((a, p) => a + countOwned(p.key), 0)
const cssTotal = cssRules.length
const cssSelTotal = cssRules.reduce((a, r) => a + (r.at ? 1 : r.sel.split(/,(?![^(]*\))/).length), 0)
if (htmlSum !== htmlTotal) fail(`元素无损性：原件 ${htmlTotal} ≠ 各件之和 ${htmlSum}`)
// 防回归（本轮调试实锤的坑）：class/id 解析若坏掉，所有元素会静默继承 _shell，总数照样相等——
// 用两条硬断言兜住：① 每条 cls:/id: 锚点必须在 index.html 上至少命中一个元素；② 非 doc 件必须至少有一个 roots。
for (const [spec] of ANCHORS) {
  if (!spec.startsWith('cls:') && !spec.startsWith('id:')) continue
  const token = spec.slice(spec.indexOf(':') + 1)
  const hit = allElements.some((e) => (spec[0] === 'c' ? e.classes.includes(token) : e.id === token))
  if (!hit) fail(`锚点 ${spec} 在 index.html 上零命中（class/id 解析或原型已变，请核对）`)
}
for (const p of PART_DEFS) {
  if (p.cssOnly || p.doc) continue
  if (!(partRoots.get(p.key) || []).length) fail(`件 ${p.key}（${partDirLabel(p)}）没有静态根元素；若确为内容/定义件请标 doc`)
}
const ownedOnce = allElements.every((e) => owner.get(e).part && partByKey.has(owner.get(e).part))
if (!ownedOnce) fail('存在归属到不存在件元素的元素')
const sumByPart = new Map()
for (const p of PART_DEFS) sumByPart.set(p.key, (cssByPart.get(p.key) || []).length)
const cssSum = [...sumByPart.values()].reduce((a, b) => a + b, 0)
if (cssSum !== cssTotal) fail(`规则无损性：原件 ${cssTotal} ≠ 各件之和 ${cssSum}`)
if (errors.length) {
  console.error('拆件校验未通过：')
  for (const e of errors.slice(0, 80)) console.error('  - ' + e)
  if (errors.length > 80) console.error(`  …共 ${errors.length} 条`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// 9. 落盘
// ---------------------------------------------------------------------------
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
for (const p of PART_DEFS) if (p.dir) mkdirSync(join(OUT, p.dir), { recursive: true })

const GEN_NOTE = '派生物 · 请勿手改：重跑 node scripts/gen-newui-parts.mjs 同步原型（Node v22）'
function headerLines(p, kind) {
  const roots = partRoots.get(p.key) || []
  const ownedCount = countOwned(p.key)
  const htmlRange = roots.length
    ? `index.html ${roots.map((r) => `L${r.lineStart}-L${r.lineEnd}`).join(' / ')}（本件持有 ${ownedCount} 个元素${roots.length > 1 ? '，' + roots.length + ' 处根' : ''}）`
    : `index.html —— 本件持有 ${ownedCount} 个元素${p.doc ? '（内容/定义件：标记由宿主件持有，出现处见下）' : ''}`
  const rs = cssByPart.get(p.key) || []
  const cssLine = p.cssOnly
    ? `styles.css —— 本件即公共底，收纳 ${rs.length} 条跨单元规则`
    : rs.length
      ? `styles.css ${kind === 'css' ? '本件收纳 ' + rs.length + ' 条规则（逐条注明来源行号）' : '中归本件的 ' + rs.length + ' 条见同名 .css'}`
      : 'styles.css —— 归本件 0 条（样式在 parts/_base.css 或宿主件 css）'
  const js = resolveJs(p.js)
  const jsLine = js.length ? `app.js：${js.join(' / ')}` : `app.js：${p.jsNote || '无独立渲染函数（静态壳件）'}`
  return [
    `件：parts/${partDirLabel(p)} —— ${p.units} · ${p.title}`,
    GEN_NOTE,
    '权威源（本件是它们的无损切片，元素/规则归属唯一；读件即读原型原文，禁止转述）：',
    '  ' + htmlRange,
    '  ' + cssLine,
    '  ' + jsLine,
    p.note ? '  备注：' + p.note : null,
    p.warn ? '  ⚠ ' + p.warn : null,
  ].filter(Boolean)
}
function htmlBlock(lines) { return `<!--\n${lines.map((l) => '  ' + l).join('\n')}\n-->\n` }
function cssBlock(lines) { return `/*\n${lines.map((l) => '  ' + l).join('\n')}\n*/\n` }

const fileCount = { html: 0, css: 0 }
// 9.1 html 件
for (const p of PART_DEFS) {
  if (p.cssOnly) continue
  const roots = partRoots.get(p.key) || []
  let body
  if (p.doc) {
    const lines = ['本件为【内容/定义件】：原型中它没有独立静态壳（或元素作为后代归宿主件），静态出现处仅列位置，不重复收录标记——无损性由此保证。']
    if (p.sheetIds) for (const id of p.sheetIds) {
      const el = allElements.find((e) => e.id === id)
      lines.push(`  · .sheet #${id}  L${el.lineStart}-L${el.lineEnd} → 实例件 ${partDirLabel(partByKey.get(owner.get(el).part))}.html`)
    }
    if (p.occCls) {
      const token = p.occCls[0].replace(/^\./, '')
      const occ = allElements.filter((e) => e.classes.includes(token))
      if (occ.length) {
        lines.push(`静态出现处 ${occ.length} 个（元素所有权在各宿主件）：`)
        for (const e of occ) lines.push(`  · <${e.tag}${e.id ? ' #' + e.id : ''}> L${e.lineStart} → ${partDirLabel(partByKey.get(owner.get(e).part))}.html`)
      } else lines.push('静态出现处 0 个：全部由 app.js 运行时生成，见头注 app.js 出处行。')
    }
    body = lines.join('\n')
  } else {
    body = roots.map((r) => (r._anchor.mode === 'self' ? renderSelf(r) : renderClaim(r))).join('\n\n')
  }
  writeFileSync(join(OUT, p.dir || '', p.file + '.html'), htmlBlock(headerLines(p, 'html')) + body + '\n', 'utf8')
  fileCount.html++
}
// 9.2 css 件
for (const p of PART_DEFS) {
  const rs = cssByPart.get(p.key) || []
  if (!rs.length) continue
  let out = cssBlock(headerLines(p, 'css'))
  let last = null
  for (const r of rs) {
    if (last !== null && r.startLine - last > 1) out += '/* …（不连续片段：中间规则归属其它件或为注释） … */\n'
    const srcLines = cssSrc.split('\n').slice(r.startLine - 1, r.endLine).join('\n')
    out += `/* ─ 源 styles.css L${r.startLine}-L${r.endLine}${r.media ? '（' + r.media + ' 内）' : ''} ─ */\n${srcLines}\n`
    last = r.endLine
  }
  writeFileSync(join(OUT, p.dir || '', p.file + '.css'), out, 'utf8')
  fileCount.css++
}

// 9.3 README
const dirStats = {}
for (const p of PART_DEFS) {
  const d = p.dir || '(root)'
  dirStats[d] = dirStats[d] || { html: 0, css: 0 }
  if (!p.cssOnly) dirStats[d].html++
  if ((cssByPart.get(p.key) || []).length) dirStats[d].css++
}
const dirLine = Object.entries(dirStats).map(([d, c]) => '`' + d + '`: ' + c.html + ' 件 html / ' + c.css + ' 件 css').join('；')
const readme = `# new_design/parts —— 原型语义单元小件（派生物）

> **${GEN_NOTE}**

- 权威源是 \`new_design/index.html\`（结构）与 \`new_design/styles.css\`（样式），交互/渲染在 \`new_design/app.js\`，数据模型示例在 \`new_design/data.js\`。**本目录只是它们的无损切分，任何人不许手改**；原型改了重跑：
  \`\`\`bash
  # Node ≥ 18（本项目 v22：/home/joe/.nvm/versions/node/v22.23.2/bin/node）
  node scripts/gen-newui-parts.mjs
  \`\`\`
- 拆件边界依据：\`src/newui/PROTOTYPE_INVENTORY.md\`（U01–U79 双向对撞报告）。派单粒度 = 一个小件，读到件即读到原型原文。
- 无损性由脚本运行时断言（不过即报错退出，无兜底桶）：
  - index.html 每个元素恰好归属一个件：本次 ${htmlTotal} 个元素 = 各件之和 ${htmlSum}，零丢失零重复；
  - styles.css 每条规则恰好归属一个件（含 _base）：本次 ${cssTotal} 条规则 / ${cssSelTotal} 个选择器，逐条唯一归属。
- 目录构成：
  - \`_base.css\`：:root token、reset、跨单元复用原子的唯一样本处（.art/.chip/.icon-btn/分页状态行等）。
  - \`_shell.html/.css\`：文档壳 + #viewport + 五只 .page 页壳（页面壳单列）。
  - \`_chrome.html/.css\`：查看器 chrome（V1–V4）——不是 App UI，RN 不承接，仅作归属收容。
  - \`common-control/ home/ playlist/ rank/ mine/ setting/ player/ search/ songlist-detail/ sheets/ radio/\`：按页面分组的单元件，一件一单元（合并/继承规则见对撞报告第六节）；\`radio/\` 是电台（播客）四层——首页 / 详情 / 搜播客 / 单集屏。
- 件里的 \`<!-- ▸ … -->\` 是「子树已划给别件」的占位指针，指回 parts 内文件；\`内容/定义件\`（如 U02/U07/sheet-chrome/timer-sheet/comment-sheet）无独立静态壳，头注列出全部出现处。
- 固定文案留在件里（本来就在 HTML/符号行里）；对照 RN 侧时文案仍走 \`src/newui/const/\`，靠件头注的 app.js 符号行回溯，不靠复制。
- 约定（对撞报告边界）：sheet = U17 chrome 定义件 + 九实例件继承（本轮新增 U85 地区抽屉），164dfa4 钉住规则归 chrome；.rank-tabs 与 .cat-row 合并为 chip-row 一件；播放器舞台按原型单元写件；CatStickerBar 是 RN 自造件不进 parts；查看器 chrome 不参与拆件。
- 退役编号：<em>U33</em>（首页电台区块 .radio-grid / .radio-card）——首页只留快捷入口那一格电台，编号不回收，.wip-tag 样式本体挪到 U84。
- 本次产出：${dirLine}。
`
writeFileSync(join(OUT, 'README.md'), readme, 'utf8')

// 9.4 src/newui/PROTOTYPE_PARTS.md（本轮唯一允许的 src/newui 写入）
const unitTable = PART_DEFS.filter((p) => !p.cssOnly).map((p) => {
  const rs = cssByPart.get(p.key) || []
  return `| ${p.units} | \`${partDirLabel(p)}\` | ${countOwned(p.key)} | ${rs.length} | ${p.title.split('（')[0]} |`
}).join('\n')
writeFileSync(resolve(root, 'src/newui/PROTOTYPE_PARTS.md'), `# PROTOTYPE_PARTS —— new_design/parts 拆件校验清单

> 本文件由 \`scripts/gen-newui-parts.mjs\` 重写（派生，勿手改）。件本体在 \`new_design/parts/\`。
> 边界依据：\`src/newui/PROTOTYPE_INVENTORY.md\`（双向对撞报告）。

## 无损校验数字（本次生成实测，运行时断言）

- index.html 元素：原件 **${htmlTotal}** = 各件持有之和 **${htmlSum}**（重复 0 / 丢失 0 / 无归属 0）。
- styles.css 规则：原件 **${cssTotal}** 条 = 各件收纳之和 **${cssSum}**；选择器 **${cssSelTotal}** 个，逐条唯一归属（@media ${mediaBlockCount} 块整体归 _chrome，@keyframes 按登记表归属）。
- app.js：只读；件头注释的符号行号在运行时实探，符号缺失即报错退出。
- 四个原型文件（index.html / styles.css / app.js / data.js）零改动。

## 件清单

| 单元 | 件（相对 parts/） | 持有元素 | 收纳规则 | 一句话 |
|---|---|---|---|---|
${unitTable}

## 派单接法建议（RN 侧）

- 一次任务 = 一个小件：读 \`parts/…/*.html\` + 同名 \`.css\`，与 RN 对应件逐字对拍。
- 缺件转正优先序（对撞报告第六节 2 条）：U32/U37/U48/U50/U51/U55/U56/U58/U62/U67/U69 十一个内联缺件已在各件头注标「转正候选」；U61 lrc-float 为功能级缺口。
- 共享原子样式只在 \`parts/_base.css\` 出现一份，别在单元件里找。
`, 'utf8')

console.log('parts 生成完成，无损校验通过')
console.log(`  元素：原件 ${htmlTotal} = 各件之和 ${htmlSum}（零丢失/零重复/零兜底）`)
console.log(`  规则：原件 ${cssTotal} 条 / 选择器 ${cssSelTotal} 个，全部唯一归属（@media ${mediaBlockCount} 块 → _chrome；@keyframes ${cssRules.filter((r) => r.at).length} 枚）`)
console.log(`  产出：${fileCount.html} 个 .html + ${fileCount.css} 个 .css + README.md（含 _base/_shell/_chrome）`)
