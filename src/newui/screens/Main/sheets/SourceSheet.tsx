import { useCallback, useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { setApiSource } from '@/core/apiSource'
import { updateSetting } from '@/core/common'
import { pause } from '@/core/player/player'
import { removeUserApi } from '@/core/userApi'
import { handleImportScript } from '@/screens/Home/Views/Setting/settings/Basic/UserApiEditModal/action'
import playerState from '@/store/player/state'
import { useSettingValue } from '@/store/setting/hook'
import { state as userApiState, useStatus, useUserApiList } from '@/store/userApi'
import { readFile, selectFile, unlink } from '@/utils/fs'
import { log } from '@/utils/log'
import apiSourceInfo from '@/utils/musicSdk/api-source-info'
import { httpFetch } from '@/utils/request'
import { assertApiSupport, TEMP_FILE_PATH } from '@/utils/tools'

import {
  ChipFlow,
  ConfirmSheet,
  EmptyTip,
  FoldMore,
  FoldToggle,
  GroupLabel,
  OpFileButton,
  OpInputRow,
  OptionRow,
  Sheet,
} from '@/newui/components'
import {
  NEW_UI_SHEET_SOURCE,
  NEW_UI_SOURCE_FILE_EXTS,
  NEW_UI_SOURCE_FOLD_LIMIT,
  NEW_UI_SOURCE_INIT_TIMEOUT_MS,
  NEW_UI_SOURCE_MAX,
  NEW_UI_SOURCE_STATE_RANK,
  PLAY_QUALITY_CHOICES,
  PLATFORM_META,
  PLATFORM_SOURCE_KEYS,
  QUALITY_ORDER,
  formatApiVersion,
  formatQualityList,
  type NewUiSourceStateKey,
} from '@/newui/const'
import { useApiSourceName, useApiSourceTick, useContentPlatform } from '@/newui/hooks'
import {
  FONT_SIZE,
  FONT_WEIGHT,
  OP_BOX,
  OP_FILE,
  OPTION_ROW,
  useTheme,
} from '@/newui/theme'
import { getQualityFallback, isQualitySupported, setContentPlatformSource, showNewUiToast, withTimeout } from '@/newui/utils'

export interface SourceSheetProps {
  visible: boolean
  onClose: () => void
  /** 底部安全区（透传给 Sheet） */
  bottomInset?: number
}

/** 当前生效音源覆盖的平台 → 档位表（global.lx.qualityList，utils/tools.ts L141 同源的读法） */
const readCovered = (): Partial<Record<LX.OnlineSource, LX.Quality[]>> => {
  const list = global.lx.qualityList ?? {}
  const covered: Partial<Record<LX.OnlineSource, LX.Quality[]>> = {}
  for (const key of PLATFORM_SOURCE_KEYS) {
    const qualitys = (list as Record<string, LX.Quality[] | undefined>)[key]
    if (qualitys?.length) covered[key] = qualitys
  }
  return covered
}

/**
 * 音源设置浮层（原型 #sourceSheet，index.html L389-407；交互 renderSheet，app.js L2172-2259）。
 * 接线全部走旧 App 自己的路径，零重写：
 * - 当前生效音源 = 设置键 common.apiSource；列表 = useUserApiList（本项目内置表为空，条目全是用户导入脚本）
 * - 切换 = setApiSource（core/apiSource.ts L10-43，内部处理 setUserApi / destroyUserApi / updateSetting / apiSourceUpdated）
 * - 平台覆盖与音质档位 = global.lx.qualityList（启动由 core/init/userApi L177 写入、core/music/utils L221
 *   播放取档读的也是它 —— sheet 只列「真能播的档」，不列平台有但音源没接的档）
 * - 导入 = 链接抓取后 handleImportScript（语义照抄旧 ScriptImportOnline L82-106：必须 http(s) URL、
 *   抓回脚本正文再导入，不是让用户粘正文）；本机文件那条路见下面「本轮补的四件事」
 * - 「音乐平台」组 = 内容平台选择器（原型 app.js L2206-2228 点行切全局 activeSource 的真实等价物）：
 *   点行经 utils/contentPlatform 写 saveSongListSetting + saveLeaderboardSetting 并脉冲，
 *   首页推荐歌单 / 首页热门单曲 / 歌单页分类与池子跟随重取（页面内不回显平台，用户 2026-10-12 拍板）。
 *   可选性只取决于平台目录接口（内置 SDK 直连平台公开页，与音源脚本无关，见 contentPlatform 头注释）；
 *   「当前音源没接上这个平台」只作行内如实提示（dim + 不可播角标），不等于不可选。
 * - 切源时「当前音质档不在新音源档位表里」不替用户改值：原型 app.js L2189-2191 同口径（注释原文
 *   「切源不把音质、内容平台重置：音质由核心按新档表自动降」，旧稿的「立即回落表首」已被原型自己撤掉）；
 *   真实项目未加载的脚本拿不到档位表（存储 info 无 sources，utils/data.ts addUserApi L554-572 只解析
 *   脚本头注释），同样不做造假式同步回落 —— 兜底交给播放核心：取地址时 getPlayQuality（core/music/utils L218-230）
 *   本就会沿 高→低 逐档自动降（曲目该档有 + 音源声明支持才算够得着，全落空则落 128k），
 *   所以「选了音源没有的高音质档 → 播不出声」在核心层面本就不会发生。UI 只负责把这条既有口径讲清，
 *   且只做展示（2026-10-15 定稿 + 2026-07-30 审计轮 QA D51 补齐）：音质区列核心认可的整档表，
 *   音源没有的档降显为不可选但可点击说明，标签保持纯音质标识（不追加「按 X 播」），
 *   表里存在置灰档时按原型常驻一句 q-note 解释；已存选择被降时给一句注释；
 *   浮层不写不支持的档（写入口收口，降不降由核心定，UI 不另造兜底）。
 *
 * 本轮补的四件事（feature.md【音源设置】，原型 U72 件 sheets/source-sheet.html + 三件共通族
 * common-control/{group-label,opt-list,op-box}.css；件里四组符号 sortedScripts / scriptFoldedNow /
 * scriptRow+askRemoveScript+removeScript / importGate+receiveScript+handleImportFile 全部落地）：
 * 1) 行尾移除（.or-del）：按下只走它自己（件里靠 e.stopPropagation，RN 靠内层 Pressable 抢下 responder），
 *    二次确认复用共通件 ConfirmSheet（原型 #confirmSheet，与删歌单 / 清缓存同一套 askConfirm 范式），
 *    动作只调既有 removeUserApi（core/userApi.ts L35）。删的正是生效那一份时的回落见 handleRemoveConfirm 注释。
 * 2) 本机导入（.op-file）：selectFile（utils/fs.ts L27，AndroidScoped.openDocument）→ readFile →
 *    handleImportScript，与在线路共用同一个 importing 闸与同一条反馈（原型 receiveScript 的位置）。
 *    方案 A：只有 SAF 这一条路 —— 旧 ChoosePath 组件与 common.useSystemFileSelector 那条内置浏览器
 *    回退路都不接（前者是旧 UI 组件、后者要拉旧主题与旧页面），选取器失败只给人话，不问「要不要回退」。
 * 3) 列表折叠（.group-label.fold + .fold-toggle + .fold-more）：阈值与默认态同原型
 *    （NEW_UI_SOURCE_FOLD_LIMIT=4，≤4 不折、>4 默认折），收起态仍把正在生效那份留在屏上；
 *    折叠态**不写本机存储**（件 app.js L2258-2259 明写「它是这一屏的排版，不是用户配置」），
 *    所以只活在 foldOverride 这个 useState 里，面板里持久化的仍是音源 / 内容平台 / 音质那三项。
 * 4) 就绪置顶（sortedScripts 的 rank 稳定排序）：见 scriptRows 注释里的方案 A 降级说明。
 * ⚠️ 屏内不出现开发者术语：扩展名、临时路径、字段名都只进这里的注释与选择器参数。
 */

/** 一行已安装音源在屏上要说的三样（标签 / 档位 / 说明），派生一次即供排序与渲染共用 */
interface SourceRow {
  item: LX.UserApi.UserApiInfo
  isActive: boolean
  stateKey: NewUiSourceStateKey
  /** 导入先后（稳定排序的兜底键，同档不重排） */
  order: number
  stateLabel: string
  em: string
}

/** .or-state 四档标签（原型 data.js L48-52 的 label，与 const 里既有那四条同源） */
const SOURCE_STATE_LABEL: Record<NewUiSourceStateKey, string> = {
  ready: NEW_UI_SHEET_SOURCE.stateReady,
  initing: NEW_UI_SHEET_SOURCE.stateIniting,
  failed: NEW_UI_SHEET_SOURCE.stateFailed,
  uninit: NEW_UI_SHEET_SOURCE.stateIdle,
}

/** .or-state 四档取色（原型 data.js tone：--ok / --brand-3 / #FF8B7E / --text-3 的 token 对应物） */
const SOURCE_STATE_TONE: Record<NewUiSourceStateKey, 'ok' | 'brand3' | 'dangerInk' | 'text3'> = {
  ready: 'ok',
  initing: 'brand3',
  failed: 'dangerInk',
  uninit: 'text3',
}
export const SourceSheet = ({ visible, onClose, bottomInset }: SourceSheetProps) => {
  const theme = useTheme()
  const apiSource = useSettingValue('common.apiSource')
  const playQuality = useSettingValue('player.playQuality')
  const userApiList = useUserApiList()
  // 生效中 user_api 的加载状态（store/userApi/hook useStatus；initing → true/false）
  const apiStatus = useStatus()
  const currentName = useApiSourceName()
  // 当前内容平台（首页/歌单跟随的那份设置；本浮层是它唯一的选择入口）
  const platform = useContentPlatform()
  // 订阅 apiSourceUpdated：启动加载完成 / 用户切源 → 覆盖表与档位整层重算
  const tick = useApiSourceTick()

  const covered = useMemo(() => readCovered(), [tick]) // eslint-disable-line react-hooks/exhaustive-deps

  // 当前音源真实支持的档位 = 覆盖平台档位并集，按 QUALITY_ORDER 从低到高（原型 sc.qualities 的真实等价物）
  const supportedQualities = useMemo(() => {
    const set = new Set<LX.Quality>()
    for (const key of PLATFORM_SOURCE_KEYS) {
      for (const q of covered[key] ?? []) set.add(q)
    }
    return QUALITY_ORDER.filter(q => set.has(q))
  }, [covered])
  const supportedQualitySet = useMemo(() => new Set(supportedQualities), [supportedQualities])

  /**
   * 「已安装音源」行模型 + 就绪置顶（原型 sortedScripts，app.js L2265：按 SCRIPT_STATE.rank 稳定排序）。
   * ⚠️ 方案 A 的降级点（原型 mock 能力与真实数据的落差，不是完成度问题）：
   * 真实侧 LX.UserApi.UserApiInfo（types/user_api.d.ts L16-26）没有状态字段，store/userApi 的 status
   * （state.ts L10-17、hook.ts L5 useStatus）只跟着**当前生效**那一份走，写入口也只有一个
   * （core/userApi.ts L22 setUserApiStatus，由 init 在加载脚本时调）。所以档位只对生效源展开：
   * 生效源按真实加载状态分 已就绪 / 初始化中 / 没就绪，其余一律「未启用」（原型 data.js 的 uninit 同义）。
   * 于是置顶效果实际是「正在用且已就绪的那份在顶」——不做「逐个预热加载脚本回写状态」，
   * 那要动 core/init 且牵动 apiInitPromise 与启动耗时。
   * 同档保持导入先后：显式带 order 兜底，不依赖引擎 sort 的稳定性。
   */
  const scriptRows = useMemo(() => {
    const coveredCount = PLATFORM_SOURCE_KEYS.filter(k => covered[k] != null).length
    const rows: SourceRow[] = userApiList.map((item, index) => {
      const isActive = item.id === apiSource
      const stateKey: NewUiSourceStateKey = isActive
        ? (apiStatus.status ? 'ready' : apiStatus.message === 'initing' ? 'initing' : 'failed')
        : 'uninit'
      // em：生效中的读运行时覆盖表「能播 N 个平台 · 音质列表」（原型 app.js L2183-2186）；
      // 一个平台都没接上时不写「能播 0 个平台」，回落到引导文案。
      // 未生效的存储信息不含能力清单，给脚本描述或如实引导，不编造平台数
      const em = isActive
        ? coveredCount > 0
          ? [
            NEW_UI_SHEET_SOURCE.platformCount(coveredCount),
            formatQualityList(supportedQualities),
          ].filter(part => part.length > 0).join(' · ')
          : NEW_UI_SHEET_SOURCE.metaFallback
        : item.description.length > 0
          ? item.description
          : NEW_UI_SHEET_SOURCE.metaFallback
      return {
        item,
        isActive,
        stateKey,
        order: index,
        stateLabel: SOURCE_STATE_LABEL[stateKey],
        em,
      }
    })
    return rows.sort((a, b) =>
      NEW_UI_SOURCE_STATE_RANK[a.stateKey] - NEW_UI_SOURCE_STATE_RANK[b.stateKey] || a.order - b.order)
  }, [apiSource, apiStatus, covered, supportedQualities, userApiList])

  /* ---- 折叠（原型 scriptFoldedNow / SCRIPT_FOLD_LIMIT，app.js L2260-2264 + renderSheet L2270-2288） ---- */
  // null = 用户没动过开关，此时默认态按条数定（>4 折）；点过一次就听用户的。
  // 件里明写这态不写本机存储（排版不是配置），故只用 useState，落不进任何持久化键。
  const [foldOverride, setFoldOverride] = useState<boolean | null>(null)
  const foldable = scriptRows.length > NEW_UI_SOURCE_FOLD_LIMIT
  // 只剩一份时按谁的意愿都没得折（原型 L2271 那句条件）
  const folded = scriptRows.length > 1 && (foldOverride ?? foldable)
  // 开关露面：越过阈值、或用户亲手折过，且手里至少还有两份（原型 L2276，不给一屏一颗永远用不上的钮）
  const showFoldToggle = scriptRows.length > 1 && (foldable || foldOverride !== null)
  // 收起态只露在用的那一份；万一它被删了正在回落，就退回露列表头一份（原型 L2281 同两支）
  const activeRows = scriptRows.filter(row => row.isActive)
  const visibleRows = folded ? (activeRows.length > 0 ? activeRows : scriptRows.slice(0, 1)) : scriptRows
  // 件里 hidden 按「不在 shown 里」算；这里按实际显示的那几行算，删空生效那份回落到头一份时不会多报一条
  const hiddenRows = scriptRows.filter(row => !visibleRows.includes(row))
  const hiddenReadyCount = hiddenRows.filter(row => row.stateKey === 'ready').length

  /**
   * 切源反馈（原型 app.js L2194-2198，QA D49）：原型那句 toast 是「已切到「X」vY」+
   * 当前这首在新音源下够不着时追加的「 · 当前这首不可播，已暂停」，并按这句把播放暂停。
   * 真实侧的新音源能力表要等脚本初始化完才写进 global.lx.qualityList
   * （core/init/userApi/index.ts L177，写完才 resolve apiInitPromise），按下这一刻读不到——不猜。
   * 于是借 core 自己维护的那颗 apiInitPromise 等到能力表落定的那一刻，把这句一次发完：
   * 判据仍走既有 utils/tools 的 assertApiSupport（本地曲恒判可播，不会被误停）；
   * 等不到（超时 / 初始化失败 → 整张能力表为空）时只报主句，不给「不可播」的假结论、也不暂停。
   */
  const announceSwitch = useCallback(async (name: string, version: string) => {
    let msg = NEW_UI_SHEET_SOURCE.switched(name, version)
    try {
      await withTimeout(global.lx.apiInitPromise[0], NEW_UI_SOURCE_INIT_TIMEOUT_MS)
    } catch {
      // 到限没 settle：读得到的覆盖表就是上一源的，判不了新源能力，按主句报完即止
      showNewUiToast(msg)
      return
    }
    const tables = readCovered()
    const playing = playerState.playMusicInfo.musicInfo
    // 播放条目可能是下载项（无 source 字段），取不到平台就不下结论
    const playingSource = playing != null && 'source' in playing ? playing.source : null
    if (Object.keys(tables).length > 0 && playingSource != null && !assertApiSupport(playingSource)) {
      void pause()
      msg += NEW_UI_SHEET_SOURCE.switchedUnplayable
    }
    showNewUiToast(msg)
  }, [])

  const handlePickScript = useCallback((item: LX.UserApi.UserApiInfo) => {
    if (item.id === apiSource) return
    setApiSource(item.id)
    void announceSwitch(item.name, item.version)
  }, [announceSwitch, apiSource])

  /* ---- 行尾移除（原型 scriptRow 的 .or-del → askRemoveScript → removeScript，app.js L2383-2420） ---- */
  // 待移除的那一份：非 null 即把共通件 ConfirmSheet 拉开（原型 #confirmSheet，与删歌单 / 清缓存同一套）
  const [removeTarget, setRemoveTarget] = useState<LX.UserApi.UserApiInfo | null>(null)

  /**
   * 真删：只调既有 removeUserApi（core/userApi.ts L35，内部删存储 + setUserApiList 同步列表）。
   * 删的正是当前生效那一份时要给播放核心留一个还能用的源，方案 A（不动 core）在容器里
   * 照旧设置页那两步接一遍 —— 判例 src/screens/Home/Views/Setting/settings/Basic/UserApiEditModal/List.tsx L90-96：
   * 内置表找 !disabled 的第一份 → 没有就取列表头一份 → setApiSource。
   * ⚠️ 代价如实写明：core 没有这个回落，于是同一份逻辑此刻**两处并存**（旧设置页一份、本浮层一份），
   *    哪天要收口应连 core 一起改，本轮只按方案 A 接，不擅自改既有行为。
   * ⚠️ 「已自动切到」的下一位在真实侧是「列表头一份」而非「第一份已就绪的」：没切过去的脚本没被解码过，
   *    就绪与否判不出来（同上面 4) 的降级点）。确认正文仍按件内逐字说「第一份已就绪的音源」，
   *    真落到谁身上由这句 toast 如实报出。
   * 「当前这首不可播，已暂停」那半句不在这里重复：它长在切源反馈 announceSwitch（要等 apiInitPromise 才判得准），
   * 移除后的新源此刻还没初始化完，在这儿判只会给假结论。
   */
  const doRemove = useCallback(async(item: LX.UserApi.UserApiInfo) => {
    const wasActive = item.id === apiSource
    await removeUserApi([item.id])
    let msg = NEW_UI_SHEET_SOURCE.removed(item.name)
    if (wasActive) {
      // removeUserApi 已把删完的列表写回 store（action.setUserApiList），这里读的就是剩下那些
      const rest = userApiState.list
      const backId = apiSourceInfo.find(api => !api.disabled)?.id ?? rest[0]?.id
      setApiSource(backId ?? '')
      const next = backId == null ? null : rest.find(api => api.id === backId)
      msg += next != null
        ? NEW_UI_SHEET_SOURCE.removedSwitched(next.name)
        : NEW_UI_SHEET_SOURCE.removedEmpty
    }
    showNewUiToast(msg)
  }, [apiSource])

  const handlePickPlatform = useCallback((key: LX.OnlineSource) => {
    // 再点当前平台不重复写（contentPlatform store 内部同款守卫，这里挡在 toast 之前）
    if (key === platform.source) return
    const label = PLATFORM_META[key].label
    setContentPlatformSource(key)
    // 目录与音源无关（见头注释）：未覆盖平台照样能选，只在 toast 里补一句如实提醒
    showNewUiToast(covered[key] != null
      ? NEW_UI_SHEET_SOURCE.platformSwitched(label)
      : NEW_UI_SHEET_SOURCE.platformSwitched(label) + NEW_UI_SHEET_SOURCE.platformSwitchedUncovered)
  }, [covered, platform.source])

  // 音质写入口收口（2026-10-13 兜底条）：只把「当前音源声明有的档」写进设置；
  // 点不支持的档不写、给一句人话说明 —— 真实降档由播放核心 getPlayQuality 完成，
  // 这里只是不把必然被降的选择存成「看起来生效」的状态（口径见 utils/quality 头注释）
  const handlePickQuality = useCallback((key: string) => {
    const q = key as LX.Quality
    if (isQualitySupported(supportedQualities, q)) {
      updateSetting({ 'player.playQuality': q })
      return
    }
    showNewUiToast(NEW_UI_SHEET_SOURCE.qualityPickUnsupported(
      currentName, q, getQualityFallback(q, supportedQualities),
    ))
  }, [currentName, supportedQualities])

  // 整档表（高→低）：支持的档正常可选；不支持的档降显不可选，但标签仍是纯音质标识
  // （「标准 128k」式），点它会给一句说明（不留「点了没反应又没说清」的死按钮）
  const qualityChips = useMemo(() => PLAY_QUALITY_CHOICES.map(q => {
    const ok = supportedQualitySet.has(q)
    return {
      key: q,
      label: NEW_UI_SHEET_SOURCE.qualityChip(q),
      active: ok && q === playQuality,
      disabled: !ok,
    }
  }), [playQuality, supportedQualitySet])

  // 已存的选择落在不支持档（切音源后的常见残留）：如实说明播放时降到哪
  const savedQualityDowngraded = supportedQualities.length > 0 && !supportedQualitySet.has(playQuality)

  // 整档表里只要有一档当前音源没有（= 出现置灰档），就常驻一句解释
  // （原型 app.js L2247 q-note，条件与渲染句同原型，QA D51）
  const hasDimQuality = supportedQualities.length > 0 &&
    PLAY_QUALITY_CHOICES.some(q => !supportedQualitySet.has(q))

  /* ---- 导入行（.op-box，index.html L402-405 同款控件；抓取语义同旧 ScriptImportOnline；
     输入行本体已抽为共通组件 OpInputRow，NameSheet 同款复用。
     本轮补上件里的 .op-file 那枚「从本机选择一份音源文件」，两条路共用同一个 importing 闸、
     同一句进行中回显（#importHint）与同一个收尾 handleImportScript —— 原型 receiveScript 的位置） ---- */
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importErr, setImportErr] = useState('')

  /** 两条路共用的两道闸（原型 importGate，app.js L2439-2448）：一次只让一份在飞 + 份数硬上限 */
  const passImportGate = useCallback((): boolean => {
    if (importing) return false
    if (userApiList.length >= NEW_UI_SOURCE_MAX) {
      setImportErr(NEW_UI_SHEET_SOURCE.importErrMax(NEW_UI_SOURCE_MAX))
      return false
    }
    setImportErr('')
    return true
  }, [importing, userApiList.length])

  /**
   * 导入成功后顺手把列表摊开（原型 receiveScript L2465：转正那一刻 `if (scriptFoldedNow()) scriptFolded = false`）。
   * 真实侧导入只入库、不预热解码（档位在切过去之后才知道，见上面 4) 的降级说明），新入库那一份落在
   * 「未启用」档、排在列表尾部 —— 列表还折着就根本没那行，所以摊开挂在「入库成功」这一刻，
   * 与原型「新来的那份必须看得见」是同一件事。
   */
  const handleImportPress = useCallback(async () => {
    if (!passImportGate()) return
    const url = importUrl.trim()
    if (!/^https?:\/\//.test(url)) {
      setImportErr(NEW_UI_SHEET_SOURCE.importErrNotUrl)
      return
    }
    setImportErr('')
    setImporting(true)
    try {
      const script = await httpFetch(url).promise.then(resp => resp.body) as string
      // 体积上限同旧 ScriptImportOnline L99-102（9MB，防抓到整页 HTML）
      if (script.length > 9_000_000) {
        setImportErr(NEW_UI_SHEET_SOURCE.importErrTooLarge)
        return
      }
      // 成败 toast 由 handleImportScript 内部包办（action.ts L7-14）；列表经 list_changed 自动刷新
      await handleImportScript(script)
      setImportUrl('')
      setFoldOverride(false)
    } catch (err: any) {
      setImportErr(NEW_UI_SHEET_SOURCE.importErrFetch(err.message ?? String(err)))
    } finally {
      setImporting(false)
    }
  }, [importUrl, passImportGate])

  /**
   * 本机导入（件 sheets/source-sheet.html L29-30 的 .op-file + 隐藏 #importFile；动作链同原型
   * handleImportFile L2481 → receiveScript）。方案 A：只走 SAF 一条路，调用链照真实侧既有那几步：
   * selectFile（utils/fs.ts L27 AndroidScoped.openDocument）→ readFile（utils/fs.ts L43）→
   * handleImportScript（action.ts L7）。参数判例见旧 ChoosePath/index.tsx L65-75
   * （extTypes 用既有常量 USER_API_SOURCE_FILE_EXT_RXP = ['js']，选中的那份被复制到 TEMP_FILE_PATH 再读回）。
   * 已知偏差（如实写明）：设置项 common.useSystemFileSelector 那条「内置文件选择器」回退路在新 UI 下
   * **不生效** —— 回退要复用旧 ChoosePath 组件与旧主题，触红线，本轮不接；失败只给人话，不问回退。
   * 屏内不出现扩展名与路径：白名单只进选择器参数，报错一律走件里那两句。
   */
  const handlePickLocalFile = useCallback(async () => {
    if (!passImportGate()) return
    let path: string | undefined
    try {
      const file = await selectFile({ extTypes: NEW_UI_SOURCE_FILE_EXTS, toPath: TEMP_FILE_PATH })
      path = file?.data
    } catch (err: any) {
      log.warn('select user api file failed: ' + String(err?.message ?? err))
      setImportErr(NEW_UI_SHEET_SOURCE.importErrNoPicker)
      return
    }
    // 用户没挑就算取消（原型 handleImportFile 对空文件也直接 return，不报错、不静默改状态）
    if (path == null) return
    // 类型复核同旧 ChoosePath L71-75：不合类型的不导入，临时副本也不留在设备上
    if (!NEW_UI_SOURCE_FILE_EXTS.some(ext => path.toLowerCase().endsWith('.' + ext))) {
      void unlink(path)
      setImportErr(NEW_UI_SHEET_SOURCE.importErrBadFile)
      return
    }
    // 从这一刻起才算「有一份在飞」（原型 importing 也只罩读取那一段，挑文件那会儿不算）
    setImporting(true)
    try {
      const script = await readFile(path)
      if (script == null || script.length === 0) throw new Error('Read file failed')
      await handleImportScript(script)
      setFoldOverride(false)
    } catch (err: any) {
      log.error('read user api file failed: ' + String(err?.message ?? err))
      // 读不出内容就是「这份东西不是音源」，仍是件里那一句，不报路径、不报字段
      setImportErr(NEW_UI_SHEET_SOURCE.importErrBadFile)
    } finally {
      setImporting(false)
    }
  }, [passImportGate])

  return (
    <>
      <Sheet
        visible={visible}
        title={NEW_UI_SHEET_SOURCE.title}
        subtitle={NEW_UI_SHEET_SOURCE.sub}
        onClose={onClose}
        bottomInset={bottomInset}
      >
        {/* 「已安装音源」组（原型 #scriptGroup + #scriptList）：标题行是 .group-label.fold 变体，
            右槽一枚折叠开关，条数没过阈值又没人亲手折过时它压根不露面（件里那句 hidden 的兜底） */}
        <GroupLabel
          label={NEW_UI_SHEET_SOURCE.groupScripts}
          trailing={
            <FoldToggle
              hidden={!showFoldToggle}
              expanded={!folded}
              label={folded
                ? NEW_UI_SHEET_SOURCE.foldExpandAll(scriptRows.length)
                : NEW_UI_SHEET_SOURCE.foldCollapse}
              onPress={() => setFoldOverride(!folded)}
            />
          }
        />
        <View style={styles.list}>
          {scriptRows.length === 0 && <EmptyTip text={NEW_UI_SHEET_SOURCE.scriptsEmptyHint} />}
          {visibleRows.map(({ item, isActive, stateKey, stateLabel, em }) => (
            <OptionRow
              key={item.id}
              name={item.name}
              version={item.version.length > 0 ? formatApiVersion(item.version) : undefined}
              sub={em}
              stateLabel={stateLabel}
              stateTone={theme.colors[SOURCE_STATE_TONE[stateKey]]}
              active={isActive}
              onPress={() => handlePickScript(item)}
              // .or-del：件里这颗垃圾桶只在这份列表出现（原型 scriptRow L2383），平台 / 音质两组不传
              onRemove={() => setRemoveTarget(item)}
              removeAriaLabel={NEW_UI_SHEET_SOURCE.removeAria(item.name)}
            />
          ))}
          {/* .fold-more：尾行本身可点，与标题行右那颗开关做的是同一件事（两条入口都通向展开） */}
          {folded && hiddenRows.length > 0 && (
            <FoldMore
              text={NEW_UI_SHEET_SOURCE.foldMore(hiddenRows.length, hiddenReadyCount)}
              onPress={() => setFoldOverride(false)}
            />
          )}
        </View>

        {/* 「音乐平台」组（原型 #platformList）= 内容平台选择器：行行可选，
            选中项 = 首页推荐歌单 / 热门单曲 / 歌单页跟随的平台；
            dim / 不可播只说明「当前音源播不出这家的歌」，不妨碍选来看 */}
        <GroupLabel label={NEW_UI_SHEET_SOURCE.groupPlatforms} />
        <View style={styles.list}>
          {PLATFORM_SOURCE_KEYS.map(key => {
            const meta = PLATFORM_META[key]
            const ok = covered[key] != null
            const isCurrent = platform.ready && key === platform.source
            return (
              <OptionRow
                key={key}
                name={meta.label}
                sub={ok
                  ? NEW_UI_SHEET_SOURCE.platformCovered
                  : NEW_UI_SHEET_SOURCE.platformUncovered(currentName, meta.label)}
                stateLabel={isCurrent
                  ? NEW_UI_SHEET_SOURCE.platformActiveTag
                  : (ok ? undefined : NEW_UI_SHEET_SOURCE.unplayableTag)}
                stateTone={isCurrent ? theme.colors.ok : theme.colors.text3}
                active={isCurrent}
                dimmed={!ok && !isCurrent}
                onPress={() => handlePickPlatform(key)}
              />
            )
          })}
        </View>

        {/* 「音质」组（原型 #qualityRow）。原型只列支持档；真实音源档位参差，光看支持档说不清
            「选高音质会降到哪」——故列整档表（高→低）：不支持的档降显不可选、点击给说明；
            写入口只收支持档（2026-10-13 兜底条，口径见 utils/quality 与本文件头注释），
            标签保持纯音质标识（2026-10-15：不写「按 X 播」），有置灰档时常驻原型那句 q-note（QA D51） */}
        <GroupLabel label={NEW_UI_SHEET_SOURCE.groupQuality} />
        {supportedQualities.length > 0 ? (
          <>
            <ChipFlow items={qualityChips} onSelect={handlePickQuality} />
            {hasDimQuality && (
              <Text style={[styles.note, { color: theme.colors.text3 }]}>
                {NEW_UI_SHEET_SOURCE.qualityDimNote}
              </Text>
            )}
            {savedQualityDowngraded && (
              <Text style={[styles.note, { color: theme.colors.text3 }]}>
                {NEW_UI_SHEET_SOURCE.qualitySavedDowngradeNote(
                  playQuality, getQualityFallback(playQuality, supportedQualities),
                )}
              </Text>
            )}
            {supportedQualities.length === 1 && (
              <Text style={[styles.note, { color: theme.colors.text3 }]}>
                {NEW_UI_SHEET_SOURCE.qualitySingleNote(currentName, supportedQualities[0])}
              </Text>
            )}
          </>
        ) : (
          <Text style={[styles.note, { color: theme.colors.text3 }]}>
            {NEW_UI_SHEET_SOURCE.qualityEmptyHint}
          </Text>
        )}

        {/* 「导入音源」组（本项目内置音源表为空、不导入则只能单选，故补真实入口；
            件 sheets/source-sheet.html L410-415 的顺序直译：.op-box → .op-file → .op-err → #importHint → .sc-hint */}
        <GroupLabel label={NEW_UI_SHEET_SOURCE.groupImport} />
        <OpInputRow
          value={importUrl}
          onChangeText={text => {
            setImportUrl(text)
            if (importErr.length > 0) setImportErr('')
          }}
          placeholder={NEW_UI_SHEET_SOURCE.importPlaceholder}
          goLabel={NEW_UI_SHEET_SOURCE.importGo}
          busyLabel={NEW_UI_SHEET_SOURCE.importGoBusy}
          busy={importing}
          keyboardType="url"
          onGo={() => { void handleImportPress() }}
        />
        {/* .op-file：件里那枚 label 包隐藏 file input 的等价物，按下走系统选取器（方案 A 单路） */}
        <OpFileButton
          label={importing ? NEW_UI_SHEET_SOURCE.importFileBusy : NEW_UI_SHEET_SOURCE.importFile}
          busy={importing}
          onPress={() => { void handlePickLocalFile() }}
          style={styles.opFile}
        />
        {importErr.length > 0 && (
          <Text style={[styles.opErr, { color: theme.colors.dangerInk }]}>{importErr}</Text>
        )}
        {/* #importHint：进行时才露面的那一句（件里 hidden 属性同此，source-sheet.css L13 给它的上距 10） */}
        {importing && (
          <Text style={[styles.note, { color: theme.colors.text3 }]}>
            {NEW_UI_SHEET_SOURCE.importHint}
          </Text>
        )}
        {/* .sc-hint：常驻一句，说清两条路的差别与「已就绪」的时机（件 html L33 逐字） */}
        <Text style={[styles.scHint, { color: theme.colors.text3 }]}>
          {NEW_UI_SHEET_SOURCE.importHintTwoPaths}
        </Text>
      </Sheet>
      {/* 移除的二次确认（原型 askRemoveScript L2391 → #confirmSheet，件 sheets/confirm-sheet.html；
          与删歌单 / 清缓存共用同一套确认交互，不另起一层）。与音源浮层同屏叠放、挂载在后，
          Android 返回键先收本层再收音源层（CreateListSheet 同款做法）；ConfirmSheet 内部先收层再回调 */}
      <ConfirmSheet
        visible={visible && removeTarget != null}
        title={removeTarget != null ? NEW_UI_SHEET_SOURCE.removeTitle(removeTarget.name) : undefined}
        okLabel={NEW_UI_SHEET_SOURCE.removeOk}
        body={removeTarget != null
          ? NEW_UI_SHEET_SOURCE.removeBody +
            (removeTarget.id === apiSource ? NEW_UI_SHEET_SOURCE.removeBodyActive : '')
          : NEW_UI_SHEET_SOURCE.removeBody}
        onConfirm={() => {
          if (removeTarget != null) void doRemove(removeTarget)
        }}
        onClose={() => setRemoveTarget(null)}
        bottomInset={bottomInset}
      />
    </>
  )
}

SourceSheet.displayName = 'NewUISourceSheet'

const styles = StyleSheet.create({
  /** .opt-list：列向 gap 7 */
  list: {
    flexDirection: 'column',
    gap: OPTION_ROW.listGap,
  },
  /** .op-err：margin-top 10 / 11.5 / 行高 1.65（styles.css L773） */
  opErr: {
    marginTop: OP_BOX.errMarginTop,
    fontSize: FONT_SIZE.captionLg,
    lineHeight: OP_BOX.errLineHeight,
    fontWeight: FONT_WEIGHT.semibold,
  },
  /** .q-note：11 / text-3 / 行高 1.6（styles.css L761） */
  note: {
    marginTop: OP_BOX.errMarginTop,
    fontSize: FONT_SIZE.caption,
    lineHeight: 18,
  },
  /** .op-file 与上面那行 .op-box 的间距（件 op-box.css L31 margin-top:9） */
  opFile: {
    marginTop: OP_FILE.marginTop,
  },
  /** .sc-hint：11 / text-3 / 上距 16 / 行高 1.7（件 sc-result.css L14，16 与 OP_BOX.marginTop 同值） */
  scHint: {
    marginTop: OP_BOX.marginTop,
    fontSize: FONT_SIZE.caption,
    lineHeight: 19,
  },
})
