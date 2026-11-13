import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Navigation } from 'react-native-navigation'

import { Art, pickArtPalette } from '@/newui/components/Art'
import { ChipFlow } from '@/newui/components/ChipFlow'
import { CoverWash } from '@/newui/components/CoverWash'
import { GroupLabel } from '@/newui/components/GroupLabel'
import { MinibarHost } from '@/newui/components/Minibar'
import { PcButton } from '@/newui/components/PcButton'
import { PlTop } from '@/newui/components/PlTop'
import { SeekControl } from '@/newui/components/SeekControl'
import { SeekTime } from '@/newui/components/SeekTime'
import { NewUiToastHost } from '@/newui/components/Toast'
import { newUiPodArtSeed } from '@/newui/const/radio'
import {
  NEW_UI_POD_EP_JUMP,
  NEW_UI_POD_EP_LABELS,
  NEW_UI_POD_EP_RATES,
  NEW_UI_POD_EP_TOAST,
  NEW_UI_POD_EP_TXT,
  newUiPodRateLabel,
} from '@/newui/const/radioDetail'
import { useNewUiSystemBar, useSafeArea, useWideLayout } from '@/newui/hooks'
import {
  type PodEpisodeSource,
  getPodPlayerSnapshot,
  isPodEpisodeActive,
  pausePodEpisode,
  resumePodEpisode,
  seekPodEpisode,
  setPodEpisodeRate,
  startPodEpisode,
  usePodPlayer,
  usePodProgress,
} from '@/newui/podcast'
import {
  FONT_WEIGHT,
  PL_LAYER,
  PLAYER,
  POD,
  SHADOW,
  Z_LAYER,
  useTheme,
} from '@/newui/theme'
import { formatDuration, showNewUiToast } from '@/newui/utils'

/**
 * U82 → U84 的 passProps 形状（契约 7.3④「传 showId + episodeIndex，或整条单集视图模型」）。
 * RNN 走原生桥，只能可序列化 plain object：这里带的是**单集视图模型**——
 * 含 ③ 给的音频直链 `episodeUrl`，因为这一屏现在真拿它出声（本轮用户拍板「接上，能真听」）。
 * 直链不过原生桥就播不了，所以它必须过桥；除此之外这里不带任何歌曲字段（单集不是歌曲，见 `podcast/podPlayer.ts`）。
 */
export interface NewUiEpisodePassEpisode {
  id: string
  /** 集名（`.epl-meta h3`） */
  title: string
  /** 总时长秒（← `trackTimeMillis / 1000`；屏上的「18 分钟」走 durationText，这个数只管进度算式） */
  sec: number
  /** 「10 月 15 日」（已过 `podDateText`） */
  dateText: string
  /** 「18 分钟」（已过 `podDurationText`）；本屏不显式用它（起止时间是 m:ss 那一档），带上备用 */
  durationText: string
  /** 一集简介：可缺席，缺则 `.epl-intro` 整块不渲染（原型 `:empty{display:none}`） */
  intro?: string
  /** ③ 给的音频直链；空串 = 接口这一集没给（按下去不出声，屏上不为此加新视觉态） */
  episodeUrl: string
}

export interface NewUiEpisodePassProps {
  /** 本机进度的归属键（`save(showId, episodeIndex, left)` 的第一参） */
  showId: string
  /** 顶排 crumb 与 `.epl-by` 左半都要它：U84 自己不发请求，节目侧那一栏由上一层带过来 */
  showName: string
  /** 节目封面（③ 给 600 档）；无图回落种子程序化底 */
  artworkUrl?: string
  /** 这一集在该节目单集数组里的下标（落盘进度时要的那位 `idx`） */
  episodeIndex: number
  episode: NewUiEpisodePassEpisode
  /**
   * 进来即播（详情屏那颗「继续播放 / 播最新单集」传 true，用户 2026-10 拍板「点了就出声」）。
   * **一次性**：本屏在挂载后消费一次就作废，之后的重渲染（进度异步补位、播放态每秒刷新）不再起播。
   * 不传 = 老行为（进屏只摆好位置，出声归播放钮）。
   */
  autoPlay?: boolean
}

export interface EpisodeScreenProps extends NewUiEpisodePassProps {
  componentId: string
}

/**
 * 单集屏（原型 `#episodeLayer`，`new_design/parts/radio/episode.{html,css}`，U84）。
 *
 * **这一屏是整层滚、不钉住**（件头与 index.html L766 末「单集屏仍是整层滚」）：
 * 顶排 `.pl-top` 就躺在滚动内容里，**不吸顶**——别把 U82 那套「固定段 + 轴」外推过来。
 * 主体是定长块，不虚拟化（对撞 7.5「不虚拟化的两处」之一）。
 *
 * **播的是真音频**（本轮用户拍板：「接上，能真听」）。件头那句「本轮不接播放器」是原型阶段的边界，
 * 现已由 `src/newui/podcast/podPlayer.ts` 接项目既有播放能力实现：屏上的进度、播停、倍速、
 * 后退 15/前进 30 读写的都是播放器真实状态；位置每秒从播放器取一次样，与原型 `epTick`
 * （app.js L2210-L2216）的每秒一次同构，只是数不再由本地计时器编出来。
 * 倍速五档（原型 `EP_RATES` L2165）现在真传给播放速率，并且**由播放模块持有**——
 * 照原型 `epState.rate` 那样跨集留存，本屏不再自存一份，免得屏上高亮的那档与实际出声的速率不是一回事。
 * 这一屏仍然**不占迷你条、不进播放列表面板、不进任何歌曲账本**：单集不是歌曲。
 * `.wip-tag` 屏上一枚实例都没有（件头 + index.html L761），所以这里**不挂任何角标、也不用文案解释「这是演示」**。
 *
 * **离场只落盘，不停声**（2026-10-23 用户拍板「跨屏续播」）：原型 `closeEpisodeLayer`（L2234-L2238）
 * 是「先 `epStop()` 再落盘」，RN 侧本轮改成只留后半句——离场记下「还剩多少」，声音继续走，重进同一集接着放。
 * 出声与让位归 `src/newui/podcast/podPlayer.ts` 管：队列只在「退出应用 / 起歌 / 定时关闭到点 /
 * 用户明确停止」四个出口让出。离层的三条路径（屏内返回钮、Android 硬件返回、组件卸载）都落在同一个
 * 落盘点（`flushProgress`，`left <= 20 秒不写` 那道门在数据层 `save` 内部，本屏不再判一遍）。
 */
export const EpisodeScreen = ({
  componentId,
  showId,
  showName,
  artworkUrl,
  episodeIndex,
  episode,
  autoPlay = false,
}: EpisodeScreenProps) => {
  const theme = useTheme()
  const { top, bottom } = useSafeArea()
  const { wide, layerPaddingX } = useWideLayout()
  useNewUiSystemBar(componentId)

  const progress = usePodProgress()
  const player = usePodPlayer()
  const artSeed = useMemo(() => newUiPodArtSeed(showId), [showId])
  const [bgC1, bgC2] = useMemo(() => pickArtPalette(artSeed), [artSeed])
  const sec = episode.sec

  /** 起播这一集要喂给播放器的全部输入（全部来自 ③ 的视图模型，不现编、不造歌曲字段） */
  const source = useMemo<PodEpisodeSource>(() => ({
    episodeId: episode.id,
    showId,
    // 进度落盘与「回到这一集」都要下标与这几栏展示文本：单集跨屏存在之后，交出去的是整份视图模型
    episodeIndex,
    title: episode.title,
    showName,
    artworkUrl: artworkUrl ?? '',
    url: episode.episodeUrl,
    durationHintSec: sec,
    dateText: episode.dateText,
    durationText: episode.durationText,
    ...(episode.intro != null ? { intro: episode.intro } : {}),
  }), [artworkUrl, episode.dateText, episode.durationText, episode.episodeUrl, episode.id, episode.intro, episode.title, episodeIndex, sec, showId, showName])

  /**
   * 队列此刻归不归这一集（归 → 屏上的数全读播放器；不归 → 读屏上这一格记的待播起点）。
   * `failed` 算「不归」：那一回压根没挂上或已经取不到值，屏上该回到「待播起点」，
   * 再按播放就是拿直链重新起播一次。
   */
  const ownsQueue =
    player.episodeId === episode.id &&
    player.phase !== 'idle' &&
    player.phase !== 'failed'

  /**
   * 放不出来时给一句话。
   *
   * `podPlayer` 把「这一集放不出来」记为 `failed`，而上面 `ownsQueue` 把这一档排除在外，
   * 屏上于是安静地弹回初始态——按下去什么都没发生，用户只会当这颗钮坏了（无声失败）。
   * 只在**进入 failed 那一次**弹：ref 记住已经提示过的那一集，相位一离开 failed（重试、换集、让位）就清空，
   * 所以每秒一帧的重渲染不会反复弹，重按再失败仍会再提示一次。
   */
  const failedToastRef = useRef<string | null>(null)
  useEffect(() => {
    if (player.episodeId !== episode.id || player.phase !== 'failed') {
      failedToastRef.current = null
      return
    }
    if (failedToastRef.current === episode.id) return
    failedToastRef.current = episode.id
    showNewUiToast(NEW_UI_POD_EP_TOAST.failed)
  }, [episode.id, player.episodeId, player.phase])

  /**
   * 待播起点：本机记的就是这一集时从「总时长 - 剩余」续起（原型 openEpisode L2169-L2171）。
   * 起播后它只做两件事：未起播时的走位、以及队列被拿走时屏上别跳回起点。
   */
  const [offset, setOffset] = useState<number>(() => {
    const entry = progress.progressOf(showId)
    if (entry == null || entry.idx !== episodeIndex) return 0
    return Math.max(0, sec - entry.left)
  })

  // 本机进度是异步读盘的：冷启动一路直进这一屏时首帧可能还是空，读到后补一次起点（只补 0 → 有值这一种）
  const progressEntries = progress.entries
  useEffect(() => {
    if (ownsQueue) return
    const entry = progressEntries.find(item => item.id === showId)
    if (entry == null || entry.idx !== episodeIndex) return
    const resumeSec = Math.max(0, sec - entry.left)
    if (resumeSec <= 0) return
    setOffset(current => (current === 0 ? resumeSec : current))
  }, [episodeIndex, ownsQueue, progressEntries, sec, showId])

  /**
   * 「进来即播」：详情屏那颗「继续播放 / 播最新单集」把 `autoPlay` 过桥过来，本屏挂载后自己起播一次。
   * 为什么不在详情屏先起播再推屏：起播原语的闸（定时停止播放开着就不起播）会把提示投给「当前屏」的
   * toast 宿主，详情屏没挂那一台，提示会落在被盖住的主屏上＝无声失败；起播放在本屏，提示就落在本屏头上。
   *
   * **单集跨屏存在之后要认「是不是已经在放这一集」**：详情屏那颗钮永远带 `autoPlay`，
   * 若这一集本来就占着播放器（用户从迷你条回来、或反复点同一颗钮），再走一次起播会把
   * 「播到一半」的位置按屏上那格旧起点重来一遍。所以这里先看一眼快照：同一集且已占着队列时
   * 不再重起，只在这一集处于暂停/播完时把它续上（暂停了还叫「继续播放」，那颗钮的语义才不落空）。
   *
   * 只消费一次：ref 落地即置 false，之后的重渲染（进度异步补位、播放态每秒刷新）都不再起播；
   * 每次进屏都是新实例（RNN push），而 `startPodEpisode` 自己就是「先清队列再挂这一集」，
   * 所以从详情屏反复点进来也不会叠出第二条音轨。
   */
  const autoPlayRef = useRef(autoPlay)
  useEffect(() => {
    if (!autoPlayRef.current) return
    autoPlayRef.current = false
    const snapshot = getPodPlayerSnapshot()
    if (snapshot.episodeId === episode.id && snapshot.phase !== 'idle' && snapshot.phase !== 'failed' && isPodEpisodeActive()) {
      if (snapshot.phase !== 'playing' && snapshot.phase !== 'loading') void resumePodEpisode()
      return
    }
    // 接口没给直链：与播放钮同一句提示（原型没有这一态，口径见 const/radioDetail.ts）
    if (episode.episodeUrl.length === 0) {
      showNewUiToast(NEW_UI_POD_EP_TOAST.noSource)
      return
    }
    void startPodEpisode(source, { startSec: offset, rate: getPodPlayerSnapshot().rate })
  }, [episode.episodeUrl, episode.id, offset, source])

  // 走位与落盘都要读最新值，而卸载回调的闭包是旧的 → ref 兜住
  // （判例 SeekControl 的 commitRef：值在 effect 里同步进 ref，不在渲染期写）
  const totalSec = ownsQueue && player.duration > 0 ? player.duration : sec
  const t = ownsQueue ? player.position : offset
  const playing = ownsQueue && (player.phase === 'playing' || player.phase === 'loading')
  const rate = player.rate
  const positionRef = useRef(t)
  useEffect(() => { positionRef.current = t })
  // 队列被歌曲那侧拿走时（本屏不离场也会被拿走），把最后一次真位置留在屏上这一格里
  useEffect(() => {
    if (ownsQueue) return
    setOffset(current => (positionRef.current > 0 ? positionRef.current : current))
  }, [ownsQueue])

  /**
   * 离场落盘（原型 closeEpisodeLayer 的那一句 `podSaveProgress`）。
   * 身份必须稳定：`usePodProgress()` 每次渲染都返回新对象，若把它列进依赖，
   * 下面那条「卸载兜底」的 effect 就会**每渲染跑一次**、在用户还没听完时提前落盘。
   * 所以最新值走 ref，回调本身零依赖。
   */
  const latestRef = useRef({ showId, episodeIndex, totalSec, t, save: progress.save })
  useEffect(() => { latestRef.current = { showId, episodeIndex, totalSec, t, save: progress.save } })
  const flushedRef = useRef(false)
  const flushProgress = useCallback(() => {
    if (flushedRef.current) return
    flushedRef.current = true
    const current = latestRef.current
    // left <= 20 秒不写、同节目只留最近一条、整表留存 8 条——门都在数据层 save 里（契约：屏内别再判）
    current.save(current.showId, current.episodeIndex, Math.round(current.totalSec - current.t))
  }, [])

  // 卸载兜底：系统返回由 BackHandler 接，父层/路由侧的 pop 只有这里看得见。
  // **只落盘、不交还播放器**（2026-10-23 用户拍板「跨屏续播」）：
  // 原型 `closeEpisodeLayer` = 关层即停是原型阶段的口径；RN 侧现在要的是「离开这一屏继续出声」，
  // 所以队列归播放模块自己管，只在退出应用 / 起歌 / 定时到点 / 明确停止这四个出口让出（见 `podcast/podPlayer.ts`）。
  // 落盘仍在这一处（离场即记下「还剩多少」），播放模块另有周期落盘兜住跨屏那一段。
  useEffect(() => () => {
    flushProgress()
  }, [flushProgress])

  const goBack = useCallback(() => {
    flushProgress()
    void Navigation.pop(componentId)
  }, [componentId, flushProgress])

  // 硬件返回键显式接管，并且**与屏内返回钮同一颗落盘点**（判例 SonglistDetailScreen.tsx:388-397；
  // 只绑屏内钮就会在系统返回时丢进度——契约 7.3③ 点名的那条漏点）
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack()
      return true
    })
    return () => { subscription.remove() }
  }, [goBack])

  /**
   * 播停（原型 `epToggle` L2224-L2229 的四支）：
   * 出声/缓冲中 → 真暂停；这一集已经挂在播放器里 → 续播（播到头那支在模块里钳回 0）；
   * 还没起播（或上一回没挂上）→ 拿 ③ 的直链重新起播，起点就是屏上这一格。
   * 接口没给直链的那一集放不出声，按下去只投一句提示（原型没有「禁用态」这一档，屏上仍不加灰态）。
   *
   * **「定时停止播放开着时不许起播」这道闸不在本屏**：它落在 `podcast/podPlayer.ts` 的
   * `startPodEpisode` / `resumePodEpisode` 第一行（含屏上人话提示），所以这三支里真被拦下的是后两支。
   * 本屏因此**不读** `global.lx.isPlayedStop`、也**不预先禁用**这颗钮：闸只堵出声这条路，
   * 看这一集、读进度、拖进度条都照旧，那颗钮的视觉也保持在它原本那一档（不是失败态、不是灰态）。
   */
  const togglePlay = useCallback(() => {
    const snapshot = getPodPlayerSnapshot()
    if (snapshot.episodeId === episode.id && snapshot.phase !== 'idle' && isPodEpisodeActive()) {
      if (snapshot.phase === 'playing' || snapshot.phase === 'loading') void pausePodEpisode()
      else void resumePodEpisode()
      return
    }
    if (episode.episodeUrl.length === 0) {
      showNewUiToast(NEW_UI_POD_EP_TOAST.noSource)
      return
    }
    void startPodEpisode(source, { startSec: t, rate: snapshot.rate })
  }, [episode.id, episode.episodeUrl, source, t])

  /** 走到第几秒：归这一集就真跳，还没起播就先记在屏上这一格，等起播时当起点喂进播放器 */
  const seekTo = useCallback((sec2: number) => {
    const target = Math.max(0, Math.min(totalSec, Math.round(sec2)))
    if (ownsQueue) void seekPodEpisode(target)
    else setOffset(target)
  }, [ownsQueue, totalSec])

  /** 后退 15 秒 / 前进 30 秒（原型 epJump L2232，钳在 0..总时长） */
  const jump = useCallback((delta: number) => { seekTo(t + delta) }, [seekTo, t])

  const handleSeekCommit = useCallback((nextRatio: number) => {
    // 与原型 bindEpisodeSeek（L2242-L2244）同一条换算：0..1 → 取整秒
    seekTo(nextRatio * totalSec)
  }, [seekTo, totalSec])

  const handleRateSelect = useCallback((key: string) => {
    const next = Number(key)
    if (!Number.isFinite(next) || next <= 0) return
    void setPodEpisodeRate(next)
  }, [])

  const ratio = totalSec > 0 ? Math.min(1, t / totalSec) : 0
  // 整层的内衬（`.pl-layer{padding:58px 16px 34px}`）：58 = 实测状态栏 + PL_LAYER.paddingTopReserve，
  // 34 那一档再吃掉底部安全区；写法与缓存理由照判例 SonglistDetailScreen.tsx:607-612。
  // 本屏是「整层滚」（原型 `.wide #episodeLayer` 注释那句：层自己就是轴，没有钉住段），所以档位落点只有一处：
  // 顶内衬吃 `.wide` 那一档的 36 − 32 = 4（styles.css:1336），左右吃 620 居中轴的内衬；
  // 竖屏那两个基线数（`PL_LAYER.paddingTopReserve` 6 / `paddingBottom` 34）一个没改：compact 两侧都回基线，逐值零变化。
  // 一处如实记着：原型同条规则把 `.wide #episodeLayer` 的**底**内衬写作 26（`tokens.ts`
  // `WIDE_STRUCTURAL.episodeLayerPaddingBottom` 已备好、目前无消费点），本轮口径是「竖向数值一律不动」，
  // 所以这里继续吃 `PL_LAYER.paddingBottom` 34 的基线 —— 要接这一位得单独拍板。
  const layerContent = useMemo(() => ({
    ...styles.layerContentBase,
    paddingTop: top + (wide?.statusReserve ?? PL_LAYER.paddingTopReserve),
    paddingHorizontal: layerPaddingX ?? PL_LAYER.paddingX,
    paddingBottom: PL_LAYER.paddingBottom + bottom,
  }), [top, bottom, wide, layerPaddingX])
  // 倍速胶囊的 items 是定长五档，稳定引用即可（Chip 的 memo 才不会白失效）
  const rateItems = useMemo(
    () => NEW_UI_POD_EP_RATES.map(value => ({
      key: String(value),
      label: newUiPodRateLabel(value),
    })),
    [],
  )

  return (
    <View
      nativeID="newui.episode.content"
      style={[styles.root, { backgroundColor: theme.colors.bg }]}
    >
      {/* .pl-bg（episode.html:10）：与详情屏同一颗 CoverWash、同一组尺寸/浓度 token */}
      <CoverWash
        colors={[bgC1, bgC2]}
        alpha={PL_LAYER.bgAlpha}
        heightRatio={PL_LAYER.bgHeightRatio}
      />

      {/* `.pl-layer{padding:58px 16px 34px}`——这一屏的 padding 落在滚动内容上（整层滚） */}
      <ScrollView
        style={styles.layer}
        contentContainerStyle={layerContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 顶排：crumb 回显**节目名**（Apple 的播放器位不写「单集」这种类别词），随整层滚、不吸顶 */}
        <PlTop
          crumbText={showName}
          backLabel={NEW_UI_POD_EP_LABELS.back}
          onBack={goBack}
          // 顶排右侧本来就没东西（episode.html 那三行只有返回 + crumb），沿用 kind:'none' 的同尺寸空槽
          right={{ kind: 'none' }}
        />

        {/* .epl-head：96 封面 + 集名 +「节目名 · M 月 D 日」（episode.css L428-L433，单点结构，屏内内联） */}
        <View style={styles.head}>
          <Art
            width={POD.eplCover}
            height={POD.eplCover}
            radius={POD.eplCoverRadius}
            seed={artSeed}
            imageUri={artworkUrl}
            style={styles.cover}
          />
          <View style={styles.headMeta}>
            {/*
              集名不设限行：原型 `.epl-meta h3`（episode.css L23）只写了字号/字重/行高，**没有**
              `-webkit-line-clamp`，长中文标题本来就该整段换行。`.epl-head` 是 `align-items:flex-end`
              + `min-height:96px`，封面固定 96 不缩，多出来的行由这一列向上长、整块往下推，
              不压住下面的摘要与控件（本屏整层可滚）。
            */}
            <Text style={[styles.epTitle, { color: theme.colors.text }]}>
              {episode.title}
            </Text>
            {/* `.epl-by`（L25）同样没有限行：节目名长了就换行，不截断 */}
            <Text style={[styles.epBy, { color: theme.colors.text2 }]}>
              {`${showName} · ${episode.dateText}`}
            </Text>
          </View>
        </View>

        {/* .epl-intro:empty{display:none} → 摘要缺席时整块不渲染，不留空位（app.js L2176 `intro || ''`） */}
        {episode.intro != null && episode.intro.length > 0 && (
          <Text style={[styles.intro, { color: theme.colors.text2 }]}>
            {episode.intro}
          </Text>
        )}

        {/* .seek（U57）：ratio/onCommit 与原型 bindDragX 的 0..1 映射同构，秒数在本屏换算后交给播放器 */}
        <SeekControl ratio={ratio} onCommit={handleSeekCommit} style={styles.seek} />

        {/* .seek-time（U58）：两端 m:ss，格式化复用共通 utils（原型 fmt(sec)，与分钟口径的 podDurationText 分文不混） */}
        <SeekTime currentText={formatDuration(t)} durationText={formatDuration(totalSec)} />

        {/* .player-controls（U59）：后退十五秒 · 播停 · 前进三十秒，三颗同一排（episode.html:22）；
            三颗现在都真作用在播放器上（seekTo / play / pause），布局与视觉一字未动 */}
        <View style={styles.controls}>
          <PcButton
            kind="ghost"
            name="prev"
            onPress={() => { jump(NEW_UI_POD_EP_JUMP.backward) }}
            accessibilityLabel={NEW_UI_POD_EP_LABELS.backward}
          />
          <PcButton
            kind="main"
            name={playing ? 'pause' : 'play'}
            onPress={togglePlay}
            accessibilityLabel={playing ? NEW_UI_POD_EP_LABELS.pause : NEW_UI_POD_EP_LABELS.play}
          />
          <PcButton
            kind="ghost"
            name="next"
            onPress={() => { jump(NEW_UI_POD_EP_JUMP.forward) }}
            accessibilityLabel={NEW_UI_POD_EP_LABELS.forward}
          />
        </View>

        {/* .group-label + .q-chips 倍速档（复用 U18/U21）：五档，1 显示「原速」 */}
        <GroupLabel label={NEW_UI_POD_EP_TXT.rateGroup} />
        <ChipFlow items={rateItems} activeKey={String(rate)} onSelect={handleRateSelect} />
      </ScrollView>

      {/* 常驻迷你播放条：本层默认磁吸圆点（原型 miniPageSnapped：不在首页就是圆点）。
          排在提示胶囊之前——圆点浮在整层内容之上，胶囊仍盖过它。
          **在放本屏这一集时整只让位**（原型 `miniAwayNow()` 的后半句，app.js L2899-2902：
          `epLive() && epLayer.show` → `.is-away`）：这一屏本身就是这一集的播放器，
          再浮一颗条就多出第二个「正在播放」。判据就是本屏的 `ownsQueue`（同一集、且队列归它），
          所以换成歌在放时这条照旧在（它画的是那首歌，不是这一集）。 */}
      <MinibarHost componentId={componentId} bottomInset={bottom} defaultSnapped away={ownsQueue} />
      {/*
        提示胶囊的承接位（共通件，主屏 / 播放页 / 详情层 / 搜索层各挂一台的同一口径）。
        本屏必须有这一台：投递方在本屏之下——`podcast/podPlayer.ts` 那道「定时停止播放开着就不起播」的闸
        会发一句提示，而本屏是被 push 出来的独立根层，不挂 Host 这句就只落在被盖住的主屏上，
        用户按下去等于什么都没发生（无声失败）。挂载位置照共通件头注：根 View 的最后一个子视图。
      */}
      <NewUiToastHost bottomInset={bottom} />
    </View>
  )
}

EpisodeScreen.displayName = 'NewUIEpisodeScreen'

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** 整层滚动的主体：压在氛围底纹之上（原型 .pl-layer > * z-index:1，与 U82 同一对写法） */
  layer: {
    flex: 1,
    zIndex: Z_LAYER.layerContent,
  },
  /** .pl-layer{padding:58px 16px 34px} 的横向那一位（上下两位随安全区在渲染期算，见 layerContent） */
  layerContentBase: {
    paddingHorizontal: PL_LAYER.paddingX,
  },
  /** .epl-head{display:flex;align-items:flex-end;gap:14px;margin:22px 0 2px;min-height:96px} */
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: POD.eplHeadGap,
    marginTop: POD.eplHeadMarginTop,
    marginBottom: POD.eplHeadMarginBottom,
    minHeight: POD.eplHeadMinHeight,
  },
  /** .epl-cover{96×96;border-radius:18px;box-shadow:0 20px 40px -20px}（负 spread 取 SHADOW.card 近似，同 hero 判例） */
  cover: {
    ...SHADOW.card,
  },
  /** .epl-meta{flex:1;min-width:0;flex-direction:column;justify-content:flex-end;gap:6px} */
  headMeta: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'flex-end',
    gap: POD.eplMetaGap,
  },
  /** .epl-meta h3{17px/900;line-height:1.4} */
  epTitle: {
    fontSize: POD.eplTitleSize,
    fontWeight: FONT_WEIGHT.black,
    lineHeight: Math.round(POD.eplTitleSize * POD.eplTitleLineHeight),
  },
  /** .epl-by{11.5px;color:text-2;line-height:1.5} */
  epBy: {
    fontSize: POD.eplBySize,
    lineHeight: Math.round(POD.eplBySize * POD.eplByLineHeight),
  },
  /** .epl-intro{12.5px;color:text-2;line-height:1.75;margin:14px 0 0} */
  intro: {
    fontSize: POD.eplIntroSize,
    lineHeight: Math.round(POD.eplIntroSize * POD.eplIntroLineHeight),
    marginTop: POD.eplIntroMarginTop,
  },
  /** .seek{margin:24px 0 8px}（SeekControl 本体只管轨道与触区，外距归容器） */
  seek: {
    marginTop: PLAYER.seekMarginTop,
    marginBottom: PLAYER.seekMarginBottom,
  },
  /** .player-controls{display:flex;align-items:center;justify-content:center;gap:38px;margin-top:18px} */
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: PLAYER.controlsGap,
    marginTop: PLAYER.controlsMarginTop,
  },
})
