/**
 * 电台单集的**真实播放**。
 *
 * ## 一、只用既有能力（不新增依赖、不改播放核心）
 * - 引擎就是项目里已在用的 `react-native-track-player`（fork 版，`src/plugins/player` 包的那一层）。
 *   本机只有这一个能播外部 URL 的音频引擎，所以**不需要新增依赖**。
 * - 初始化走既有 `initial()`，入参与 `src/core/player/player.ts` 的 `handlePlay` 那五行设置一致；
 *   播停、跳转、时长与位置、倍速走既有 `setPlay / setPause / setCurrentTime / getPosition / getDuration / setPlaybackRate`。
 * - `TrackPlayer` 只直接调用队列级的 `reset / add / getQueue / getState / getCurrentTrack / getTrack / updateNowPlayingMetadata`
 *   ——既有导出里没有等价封装。这些都是**往既有能力里新增一次调用**：`src/core/`、`src/plugins/`、`src/store/`
 *   里既有函数的签名、行为、内部逻辑一律未改动，`@/store/setting/state` 只读。
 *
 * ## 二、与歌曲那侧的互斥口径（为什么这样不伤歌曲链路）
 * 1. **单集不是歌曲**：不替单集造 `musicId` / `original` / `source` 这类歌曲字段，不进播放列表面板、
 *    不进播放历史、不进 `playList`。这条 track 只带 `url / title / artist / artwork / duration`；
 *    id 形如 `podcast#<集id>__//<序号>`，**永远不会以 `//default` 结尾**，歌曲那侧的判空规则
 *    （`isEmpty` / `isTempId`）命中不到它，它也就不可能被当成歌曲记进任何歌曲账本。
 * 2. **抢占前先停歌**：起播单集前调既有 `setPause()`。不走既有 `stop()`——`setStop()` 内部会
 *    `skipToNext()`，那一下会踩到既有 `playerEnded → playNext` 的自动连播（本仓 UI 从没调用过 `stop()`，
 *    属未验证路径），电台不该替歌曲把下一首顶出来。
 * 3. **把 `global.lx.playerTrackId` 写回它自己的初值 `''`**（本轮唯一一次写既有全局，且只写回初值）。
 *    目的：让 `src/plugins/player/service.ts` 的 PlaybackState 处理在第一行 `isTempId()` 就早退，
 *    于是 `playerState.isPlay`、`playProgress` 的每秒轮询与 `savePlayInfo` 都不会被单集带着跑——
 *    不这么做的话，单集的秒数会被当成歌曲进度写进磁盘（正是用户点名的「混污」）。
 *    `''` 是 `src/config/globalData.ts` 给这个字段的初值，不是我们发明的中间态。
 * 4. **跨屏占着队列（2026-10-23 用户拍板「真统一」）**：单集不再跟着单集屏的生死走——
 *    离开单集屏**不 reset、不出声停**，队列一直归这一集，重进同一集接着放。
 *    只在四个出口让出队列：**退出应用 / 起歌（切歌）/ 定时关闭到点 / 用户明确停止**（`detachQueue()` 是唯一收口）。
 * 5. **起歌时怎么让得干净**（这是本轮最要紧的一处，逐条对着既有实现推过）：
 *    歌曲那侧起播一条歌必然是 `add([url轨, default轨]) → skip(新轨) → remove(除末两条外的旧轨)`，
 *    而 `src/plugins/player/playList.ts` 的 `getCurrentTrackId()` 用 `list[原生下标]` 取 id，
 *    `list` 里**没有我们这条单集轨**（我们从不往歌曲账本 push）。于是我们那条轨只要还躺在队列里，
 *    两边就错位一格：`list[下标]` 会读到下一格（往往是 `//default` 那条），
 *    `service.ts` 的 `if (isEmpty())` 便会误判成「临时暂停」→ `pause()` + `playerEnded` → `playNext(true)`
 *    （核心 `core/init/player/player.ts` 的 handleEnded）。所以**必须在歌曲 add 之前把队列让空**，
 *    让歌曲那侧走它自己最熟的那条「当前轨为空 → add → skip → play」的老路。两条让位触发点：
 *    - **`setStop()`**：`handlePlay` 起歌第一步就是 `setStop()`（`TrackPlayer.stop()`），
 *      我们会收到 `PlaybackState=Stopped`（事件驱动，无延迟），此刻歌曲那侧的取流还被
 *      `debounceBackgroundTimer(…, 200)` 挡着 200ms，足够我们把队列清干净；
 *    - **`global.lx.gettingUrlId`**：`setMusicUrl` 一进去就同步写它（歌曲那侧取流的唯一同步信号），
 *      我们用一个 250ms 的轻量看门（只读全局，不打原生）盯它的变化，兜住「不先 stop 就直接取流」那条路
 *      （旧 UI 迷你条那颗 play 走的就是 `play() → isEmpty() → setMusicUrl`，没有 setStop）。
 *    让位时**只在队列里还没别人的轨时才 `reset()`**：反过来的情形（歌曲轨已经 add 进来）绝不能清，
 *    那会把歌曲刚挂上的轨一起摘掉——那时只把自己的状态收回 idle，我们那条旧轨由歌曲那侧自己的
 *    `remove(除末两条外的旧轨)` 顺手带走。
 * 6. **队列时序**（每一步都对着既有实现挑过）：
 *    `setPause()`（停歌）→ `reset()` → `add([单集])` → 让一拍 → 写回 `playerTrackId = ''`
 *    → `setCurrentTime(起点)` → `setPlaybackRate(倍速)` → `setPlay()` → `updateNowPlayingMetadata()`。
 *    `reset()` 在原生侧（`ExoPlayback.reset()`）会**先把 `lastKnownWindow` 置为 `INDEX_UNSET`**，
 *    所以紧接着的那次 `onMediaItemTransition` 里 `prevIndex == null`，`MusicManager.onTrackUpdate`
 *    便不会往事件里放 `track`；`service.ts` 的 `if (info.track == null) return` 因此早退，
 *    不会对单集做它专门的「临时暂停」。加完 track 后再让一拍才写指针，是为了压过
 *    `service.ts` 那句 `global.lx.playerTrackId = await getCurrentTrackId()` 的异步续跑；
 *    之后每秒的轮询里再按回一次，兜住任何晚到的重写。
 * 7. **通知栏/锁屏元数据跟着真正在播的一方走**：起播/续播单集时由我们 `updateNowPlayingMetadata`
 *    喂单集的标题/节目名/封面；歌曲接管时不需要我们出手——歌曲那侧的 `core/init/player/playStatus.ts`
 *    会在它自己的 `play` 事件里 `updateMetaData()` 把标题刷回歌曲（我们让位时一个字段都不写，
 *    正是为了让那条既有链路照常跑）。
 *
 * ## 三、远控路由（2026-10-23 用户拍板解除旧限制）
 * `src/plugins/player/service.ts` 的远控表在分派处加一层判断：**单集占着队列且歌曲没在放**时，
 * Play/Pause/Seek 作用于单集，Next/Prev 直接忽略（单集没有「下一集」这回事，也不许因此推进歌曲），
 * Stop 保持「退出应用」的既有语义但先把单集进度落盘。歌曲在播或两边都停时，行为与原来一字不差。
 * 分派只认一个极薄的中转表 `./remoteRoute`（零依赖，服务进程侧不拉电台数据层/提示总线），
 * 本模块在加载时把实现注册进去；表里没人 = 电台 UI 从没加载过 = 一律走歌曲那套。
 *
 * ## 四、进度落盘（为什么不只挂在单集屏卸载那一处）
 * 单集现在跨屏存在，卸载不再是唯一出口，所以落盘收在本模块：**暂停 / 自然播完 / 让位 / 交还 /
 * 远控 Stop 前**各落一次，另外播放期间**每 10 秒**落一次（`PERIODIC_SAVE_MS`）——定时关闭到点会
 * 直接退出应用（见第五节），周期落盘让那次退出最多只丢 10 秒。门（`left <= 20 秒不写`、同节目只留
 * 最近一条、整表 8 条）全在 `localState.savePodProgress` 内部，这里不再判一遍。
 *
 * ## 五、定时停止播放
 * 起播原语 `startPodEpisode` / `resumePodEpisode` 最前面读一次 `global.lx.isPlayedStop`
 * （歌曲那侧「定时停止播放」的账本，`src/core/player/timeoutExit.ts` 写），为 true 就**不起播**。
 * 闸落在**原语**这一层而非只落在屏上那颗钮，所以任何调用点（单集屏那颗、远控那颗、以后新增的哪颗）
 * 都必然过。
 *
 * 定时**到点那一刻**的收敛点在 `timeoutTools.exit()`：`player.timeoutExitPlayed && playerState.isPlay`
 * 时只置 `isPlayedStop = true` 等歌曲自己放完，否则直接 `exitApp('Timeout Exit')`。而单集播放期间
 * `playerState.isPlay` **恒为 false**（第二节第 3 条：单集的状态事件被 `isTempId()` 挡掉了），
 * 所以到点一定走「退出应用」那一支——`exitApp` 里 `destroyPlayer()` 会停掉音频，单集随之停住，
 * 进度由第四节那句周期落盘兜住。要让它走「只暂停不退出」得改 `timeoutTools.exit()` 的判定条件
 * （`src/core/`），本轮按边界要求**没有动**，已在交付报告里单列。
 * 本模块这一侧只做两件不改既有行为的事：`isPlayedStop` **只读不写**（写它等于替用户取消定时关闭）；
 * 轮询里发现它已 armed（等待歌曲放完那一支）就把正在播的这一集停在原地，别让「定时生效了却还在出声」。
 *
 * ## 六、不造歌曲字段、不碰歌曲账本
 * 单集 track 只带 `url / title / artist / artwork / duration`，id 前缀 `podcast#`；`playList`、
 * 播放历史、收藏、「我喜欢」一概不收它。指针 `playerTrackId` 沿用第三节第 3 条的口径（写回 `''`），
 * 于是歌曲侧来取流时 `isEmpty()` 为真，它自己的 `play()` 会重新取一次 URL 接管——这是既有自愈路径。
 */
import type { EmitterSubscription } from 'react-native'

import TrackPlayer, { Event, State } from 'react-native-track-player'

import { NEW_UI_POD_EP_TOAST } from '@/newui/const/radioDetail'
import { showNewUiToast } from '@/newui/utils/newUiToast'

import {
  getDuration,
  getPosition,
  initial as playerInitial,
  isInitialized,
  setPause,
  setPlay,
  setPlaybackRate,
  setCurrentTime,
} from '@/plugins/player'
import settingState from '@/store/setting/state'

import { flushPodProgress, savePodProgress } from './localState'
import { registerPodRemoteHandlers } from './remoteRoute'

/**
 * 播放阶段。`loading` = 想出声但还在连/缓冲；`ended` = 自然播到尽头（原型 `epTick` 到点钳住那一支）；
 * `failed` = 播放器报错（直链失效这类），屏上不为此加新视觉，玩家钮回到「播放」让用户自己重试。
 */
export type PodPlayerPhase = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'failed'

/** 起播一集所需的全部输入（全部来自 ③ 的视图模型，屏上不现编） */
export interface PodEpisodeSource {
  /** 单集 id（③ 的 `trackId` 转串）：队列归属凭据 */
  episodeId: string
  /** 节目 id：本机进度的登记键（口径本轮不动） */
  showId: string
  /** 这一集在节目单集数组里的下标：进度落盘要的 `idx`（本模块跨屏落盘时用） */
  episodeIndex: number
  /** 集名 → 通知栏标题 */
  title: string
  /** 节目名 → 通知栏副标题（Apple 的播放器位不写类别词） */
  showName: string
  /** 封面（是否进通知栏照歌曲那侧同一既有设置 `player.isShowNotificationImage`） */
  artworkUrl: string
  /** ③ 给的那条音频直链；空串 = 接口没给，这一集放不出来 */
  url: string
  /** ③ 的 `trackTimeMillis` 换算秒数；播放器还没给出时长前，屏上「总时长」用它 */
  durationHintSec: number
  /** 「10 月 15 日」（已过 `podDateText`）：重开单集屏时原样带回去 */
  dateText: string
  /** 「18 分钟」（已过 `podDurationText`）：重开单集屏时原样带回去 */
  durationText: string
  /** 一集简介：可缺席（缺则那一屏整块不渲染） */
  intro?: string
}

/** 屏上真正要看的那几个数（模块级快照，与 `localState.ts` 同一套「快照 + 订阅集合 + notify」姿势） */
export interface PodPlayerSnapshot {
  /** 当前占着播放器的那一集；没有则空串 */
  episodeId: string
  showId: string
  /** 集名（迷你条将来要显示的那一栏；跨屏播放期间屏不在也得能读到） */
  title: string
  /** 节目名（同上） */
  showName: string
  /** 封面原始 URI（同上） */
  artworkUrl: string
  phase: PodPlayerPhase
  /** 已播到第几秒（真音频位置，取整） */
  position: number
  /** 播放器实测总时长（取整）；未就绪为 0，界面回落 `durationHintSec` */
  duration: number
  /** 生效中的倍速 */
  rate: number
  /** 这一集有没有直链（false 时屏上那颗播放钮按下去不出声，本轮不加新视觉态） */
  hasUrl: boolean
}

/**
 * 「回到当前这一集的单集屏」所需的 passProps（与 `NewUiEpisodePassProps` 结构一致，
 * 但这里不 import 屏的类型：数据层不该反向依赖屏）。迷你条将来直接
 * `pushNewUiEpisode(componentId, target)`，或在桶文件里用 `openPodEpisodeScreen(componentId)`。
 */
export interface PodEpisodeTarget {
  showId: string
  showName: string
  artworkUrl: string
  episodeIndex: number
  episode: {
    id: string
    title: string
    sec: number
    dateText: string
    durationText: string
    intro?: string
    episodeUrl: string
  }
}

const IDLE_SNAPSHOT: PodPlayerSnapshot = {
  episodeId: '',
  showId: '',
  title: '',
  showName: '',
  artworkUrl: '',
  phase: 'idle',
  position: 0,
  duration: 0,
  rate: 1,
  hasUrl: false,
}

/** 每秒取样一次（原型 `setInterval(epTick, 1000)` 的同构位置）；只在数值真的变了才 notify */
const POLL_INTERVAL_MS = 1000
/**
 * 歌曲取流看门的间隔。只读 `global.lx.gettingUrlId`（不碰原生），所以可以比轮询密一个量级：
 * 它要在歌曲那侧 `add` 之前抢到让位，窗口是「一次取流耗时」，越密越稳。
 */
const SONG_WATCH_MS = 250
/**
 * 播放期间每多少毫秒落一次进度。定时关闭到点会直接退出应用（文件头第五节），
 * 这一句决定那次退出最多丢多少秒。
 */
const PERIODIC_SAVE_MS = 10_000
/**
 * 加完 track 后让一拍，好把 `service.ts` 那句 `await getCurrentTrackId()` 的异步续跑压在过去。
 * 一拍（macrotask）就够，不是等待时长——原生事件本身已经在 `add` 之前落定了。
 */
const ONE_TICK_MS = 0
/** 连续取不到播放器数值到这个次数，就认这一集放不出来（直链 404 时 Exo 会停在 None/Ready） */
const POLL_FAIL_LIMIT = 3
/** 我们自己挂进队列的 track id 前缀（判「队列里还有没有别人的轨」用） */
const POD_TRACK_ID_PREFIX = 'podcast#'

type Listener = () => void

let snapshot: PodPlayerSnapshot = IDLE_SNAPSHOT
const listeners = new Set<Listener>()

const notify = (): void => {
  for (const listener of [...listeners]) listener()
}

/** 只在真有变化时换快照对象并 notify（每秒轮询不该让屏白重渲染一次） */
const commit = (patch: Partial<PodPlayerSnapshot>): void => {
  const next = { ...snapshot, ...patch }
  if (
    next.episodeId === snapshot.episodeId &&
    next.showId === snapshot.showId &&
    next.title === snapshot.title &&
    next.showName === snapshot.showName &&
    next.artworkUrl === snapshot.artworkUrl &&
    next.phase === snapshot.phase &&
    next.position === snapshot.position &&
    next.duration === snapshot.duration &&
    next.rate === snapshot.rate &&
    next.hasUrl === snapshot.hasUrl
  ) return
  snapshot = next
  notify()
}

/* ================= 队列归属（模块级，不进 React） ================= */

/** 每次启动/让位都自增：在途的异步启动序列凭它作废自己，避免慢网络回来把新的一集顶掉 */
let startToken = 0
/** 我们塞进队列的那条 track 的 id；不是它 = 队列已被歌曲那侧拿走 */
let activeTrackId: string | null = null
/** 当前占着播放器的那一集的全部输入（进度落盘与「回到单集屏」都要它）；让位即清空 */
let activeSource: PodEpisodeSource | null = null
/** 用户的意图：true = 该出声（用来区分「缓冲中」与「用户暂停」） */
let desiredPlaying = false
/** 已自然播到尽头 */
let reachedEnd = false
/** 上一集用过的倍速（原型 `epState.rate` 跨集留存，只有 `t/playing/idx` 每次重置） */
let lastRate = 1
/** 上一次落盘的时刻（周期落盘用） */
let lastSavedAt = 0
let pollTimer: ReturnType<typeof setInterval> | null = null
let pollFailures = 0
let trackSeq = 0
const subscriptions: EmitterSubscription[] = []

/** 歌曲取流看门（文件头第二节第 5 条第二条触发点） */
let songWatchTimer: ReturnType<typeof setInterval> | null = null
/** 看门记的 `gettingUrlId`：只认「变化成非空」这一下，免得开局就带着一个陈旧值把单集误杀 */
let lastSeenGettingUrlId = ''

const stopPoll = (): void => {
  if (pollTimer == null) return
  clearInterval(pollTimer)
  pollTimer = null
}

const startPoll = (): void => {
  if (pollTimer != null) return
  pollFailures = 0
  pollTimer = setInterval(() => { void tick() }, POLL_INTERVAL_MS)
  void tick()
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => { setTimeout(resolve, ms) })

/** 单集 track 的 id：带 `__//` 是照歌曲那侧的分段写法，但结尾绝不是 `default`，歌曲的判空规则碰不到它 */
const nextTrackId = (episodeId: string): string => `podcast#${episodeId}__//${String(++trackSeq)}`

/** 交还队列时的中立姿势：把指针按回它自己的初值（理由见文件头第二节第 3 条） */
const neutralizeSongPointer = (): void => {
  global.lx.playerTrackId = ''
}

/**
 * 把「当前这一集播到哪」写进本机进度表。
 * 时长还没量出来（0）时不写：那时 `duration - position` 是负的，写进去等于把进度清零。
 */
const saveProgressNow = (): void => {
  const source = activeSource
  if (source == null) return
  const duration = snapshot.duration
  if (duration <= 0) return
  savePodProgress(source.showId, source.episodeIndex, Math.round(duration - snapshot.position))
}

/**
 * 队列里除我们那条之外，还有别人的轨吗（= 歌曲那侧已经 add 进来了）。
 * 取不到队列时**当作有**：宁可不清，也不要把歌曲刚挂上的轨一起摘掉。
 */
const queueHasForeignTrack = async(ours: string): Promise<boolean> => {
  try {
    const queue = await TrackPlayer.getQueue()
    return queue.some(track => {
      const id = String(track?.id ?? '')
      return id !== ours && !id.startsWith(POD_TRACK_ID_PREFIX)
    })
  } catch {
    return true
  }
}

/**
 * 让出播放器（文件头第二节第 4 条的四个出口都走这里）：
 * 落盘 → 快照回 idle → 队列里还没有别人的轨时才清空 → 倍速按回歌曲设置。
 * 状态先同步收干净（`activeTrackId = null`、`activeSource = null` 都在第一个 await 之前），
 * 所以并发的第二次调用会当场早退，不会重复清队列。
 */
const detachQueue = async(): Promise<void> => {
  if (activeTrackId == null && snapshot.episodeId.length === 0) return
  const ours = activeTrackId
  saveProgressNow()
  ++startToken
  stopPoll()
  stopSongWatch()
  activeTrackId = null
  activeSource = null
  desiredPlaying = false
  reachedEnd = false
  commit({ ...IDLE_SNAPSHOT, rate: lastRate })
  if (ours == null) return
  // 歌曲轨已经进队列了：不许清（清了会连它一起摘掉），我们那条旧轨由歌曲那侧自己的 remove 带走
  if (await queueHasForeignTrack(ours)) return
  try {
    await TrackPlayer.reset()
  } catch {
    // 队列已经不在我们手里，不必再补刀
  }
  await sleep(ONE_TICK_MS)
  // 倍速是播放器级参数，交还时把歌曲那侧的值放回去
  await setPlaybackRate(settingState.setting['player.playbackRate']).catch(() => {})
  neutralizeSongPointer()
}

/**
 * 认域：当前轨还是我们那条吗？
 * 是 → 顺手把 `playerTrackId` 按回初值（可能刚被 `service.ts` 读成陈旧歌曲 id）；
 * 不是（或被清空）→ 单集让位（被动让位：队列已经被别人占了，这里一个队列操作都不做）。
 */
const reclaimOwnership = async(): Promise<void> => {
  if (activeTrackId == null) return
  try {
    const index = await TrackPlayer.getCurrentTrack()
    const track = index == null ? null : await TrackPlayer.getTrack(index)
    if (track?.id === activeTrackId) {
      neutralizeSongPointer()
      return
    }
  } catch {
    // 取不到就当没被拿走，交给下一次轮询判断
    return
  }
  if (activeTrackId != null) await detachQueue()
}

/* ================= 歌曲接管看门（文件头第二节第 5 条） ================= */

const checkSongTakeover = (): void => {
  if (activeTrackId == null) return
  const gettingUrlId = global.lx.gettingUrlId
  if (gettingUrlId === lastSeenGettingUrlId) return
  lastSeenGettingUrlId = gettingUrlId
  // 变成空串只是歌曲那侧一次取流收尾，不代表有人要接管
  if (gettingUrlId.length === 0) return
  void detachQueue()
}

const stopSongWatch = (): void => {
  if (songWatchTimer == null) return
  clearInterval(songWatchTimer)
  songWatchTimer = null
}

/**
 * 看门起步时先把当下的 `gettingUrlId` 记下来当基线：陈旧的非空值（上一次取流被切歌打断、
 * `.finally` 里没清掉）不会被误当成「刚开始取流」，只有真的一次新取流（值变化）才触发让位。
 */
const startSongWatch = (): void => {
  lastSeenGettingUrlId = global.lx.gettingUrlId
  if (songWatchTimer != null) return
  songWatchTimer = setInterval(checkSongTakeover, SONG_WATCH_MS)
}

/* ================= 播放器取样 ================= */

const phaseFromState = (state: State): PodPlayerPhase => {
  if (reachedEnd) return 'ended'
  switch (state) {
    case State.Playing:
      return 'playing'
    case State.Buffering:
    case State.Connecting:
      return desiredPlaying ? 'loading' : 'paused'
    case State.Paused:
    case State.Ready:
    case State.Stopped:
    case State.None:
    default:
      return desiredPlaying ? 'loading' : 'paused'
  }
}

/** 定时停止播放已 armed（等待歌曲放完那一支）时，正在播的这一集也得停：不能「定时生效了却还在出声」 */
const pauseForSleepTimer = (): void => {
  if (!global.lx.isPlayedStop) return
  if (snapshot.phase !== 'playing' && snapshot.phase !== 'loading') return
  desiredPlaying = false
  void setPause().catch(() => {})
  saveProgressNow()
  commit({ phase: reachedEnd ? 'ended' : 'paused' })
}

/** 播放期间周期性落盘（文件头第四节） */
const maybeSavePeriodically = (): void => {
  if (snapshot.phase !== 'playing') return
  const now = Date.now()
  if (now - lastSavedAt < PERIODIC_SAVE_MS) return
  lastSavedAt = now
  saveProgressNow()
}

const tick = async(): Promise<void> => {
  if (activeTrackId == null) return
  // 先确认队列还归这一集（是 → 顺手把指针按回初值；不是 → 让位并停在这）
  await reclaimOwnership()
  if (activeTrackId == null) return
  try {
    const [state, position, duration] = await Promise.all([
      TrackPlayer.getState(),
      getPosition(),
      getDuration(),
    ])
    if (activeTrackId == null) return
    pollFailures = 0
    const realDuration = Math.round(duration)
    const realPosition = Math.round(position)
    // 到点钳住：既有事件里 Exo 会把 STATE_ENDED 报成 Stopped，但没有独立的「播完」事件保证到达，
    // 这里用「位置已到尽头且不再出声」自己认一次（原型 epTick 的那一支钳位）
    if (!reachedEnd && realDuration > 0 && realPosition >= realDuration - 1 && state !== State.Playing) {
      reachedEnd = true
      desiredPlaying = false
      saveProgressNow()
    }
    commit({
      position: reachedEnd ? (realDuration > 0 ? realDuration : snapshot.duration) : realPosition,
      duration: realDuration > 0 ? realDuration : snapshot.duration,
      phase: phaseFromState(state),
    })
    pauseForSleepTimer()
    maybeSavePeriodically()
  } catch {
    if (activeTrackId == null) return
    if (++pollFailures >= POLL_FAIL_LIMIT) {
      desiredPlaying = false
      stopPoll()
      stopSongWatch()
      activeTrackId = null
      commit({ phase: 'failed' })
    }
  }
}

/* ================= 事件监听（只在本模块主张队列时才有意义，常驻即可） ================= */

/**
 * 原生侧被「非本模块」停住了（`Stopped`）：
 * 歌曲那侧起播第一步就是 `setStop()`（`TrackPlayer.stop()`），这是最靠前、最可靠的让位信号。
 * 只认 `Stopped`、不认 `None`：`None` 在 `reset()`／播放器重建／离屏销毁这些我们自己的动作里也会出现，
 * 认它等于给自己挖坑。自己播到头也会报 `Stopped`，所以先排掉「位置已到尽头」那一种；
 * 队列重建途中的事件也不会误判（那时 `activeTrackId` 已经被清空）。
 */
const handleExternalStop = async(): Promise<void> => {
  const ours = activeTrackId
  if (ours == null) return
  try {
    const [state, position, duration] = await Promise.all([
      TrackPlayer.getState(),
      getPosition(),
      getDuration(),
    ])
    if (activeTrackId !== ours) return
    if (state === State.Playing || state === State.Buffering || state === State.Connecting) return
    if (reachedEnd) return
    if (duration > 0 && position >= duration - 1) return
  } catch {
    return
  }
  await detachQueue()
}

const ensureEventListeners = (): void => {
  if (subscriptions.length > 0) return
  subscriptions.push(TrackPlayer.addEventListener(Event.PlaybackTrackChanged, () => { void reclaimOwnership() }))
  subscriptions.push(TrackPlayer.addEventListener(Event.PlaybackState, info => {
    // 只认 Stopped（理由见上面 handleExternalStop）：None 在我们自己的 reset/destroy 里也会出现
    if (info.state !== State.Stopped) return
    void handleExternalStop()
  }))
  subscriptions.push(TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async() => {
    if (activeTrackId == null) return
    reachedEnd = true
    desiredPlaying = false
    const duration = await getDuration().catch(() => 0)
    commit({ phase: 'ended', position: Math.round(duration) || snapshot.duration })
    saveProgressNow()
  }))
  subscriptions.push(TrackPlayer.addEventListener(Event.PlaybackError, () => {
    if (activeTrackId == null) return
    desiredPlaying = false
    stopPoll()
    stopSongWatch()
    saveProgressNow()
    commit({ phase: 'failed' })
  }))
}

/* ================= 定时停止播放闸门（文件头第五节） ================= */

/**
 * 「定时停止播放」是不是正生效中（歌曲那侧的账本 `global.lx.isPlayedStop`，电台这侧**只读不写**：
 * 写它等于替用户取消定时）。为 true 时不起播单集：不进队列、不出声、一个快照字段都不动，只给人话提示。
 *
 * 为什么闸落在**起播原语**而不只落在屏上那颗钮：单集屏那颗、详情屏那颗钮的下游、以后任何调用起播/续播的点，
 * 都只有经过这里才可能出声——闸在原语这一层才谈得上「所有起播路径都过」。
 * 为什么提示也在这里发：闸把出声这条路堵死之后若没人吭声，用户按下去只当这颗钮坏了（无声失败）。
 * 提示走既有共通总线 `@/newui/utils/newUiToast`（由所在屏根层的 `NewUiToastHost` 承接），不新造浮层、不新增视觉态。
 * 为什么不新增一档相位：`failed` 专指「直链放不出来」，那颗钮在那一档的含义是「可以再按一次试试」；
 * 定时开着时再按一百次也不会好，把两件事塞进同一档等于把「可重试」的假象交给用户。
 * 本函数只在 `commit()` 之前返回，快照留在它原本那一档（`idle` / `paused` 都显「播放」），不是失败态。
 *
 * @returns true = 已被拦下（提示已就地发出），调用方必须原样返回、不要再往下走起播序列
 */
const blockedBySleepTimer = (): boolean => {
  if (!global.lx.isPlayedStop) return false
  showNewUiToast(NEW_UI_POD_EP_TOAST.sleepBlocked, 'long')
  return true
}

/* ================= 对外动作 ================= */

/** 快照（引用稳定，屏外/离场等非渲染处读它） */
export const getPodPlayerSnapshot = (): PodPlayerSnapshot => snapshot

/** 订阅播放态变化；返回退订（与 `localState.ts` 同一套「快照 + 订阅集合 + notify」姿势，本模块不读盘） */
export const subscribePodPlayer = (listener: Listener): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * 「回到当前这一集的单集屏」要带的那份视图模型；没有在播（或刚让位）的一集时是 null。
 * 单集跨屏存在之后，迷你条将来就靠它把用户送回这一屏（本模块不出 UI）。
 */
export const getPodEpisodeTarget = (): PodEpisodeTarget | null => {
  const source = activeSource
  if (source == null) return null
  return {
    showId: source.showId,
    showName: source.showName,
    artworkUrl: source.artworkUrl,
    episodeIndex: source.episodeIndex,
    episode: {
      id: source.episodeId,
      title: source.title,
      sec: source.durationHintSec,
      dateText: source.dateText,
      durationText: source.durationText,
      ...(source.intro != null ? { intro: source.intro } : {}),
      episodeUrl: source.url,
    },
  }
}

/**
 * 把当前进度落盘并等它真的写进存储（远控 Stop / 退出应用前用）。
 * 顺手让这一集停住：出口就那几个，声音不该比进程多活一段。
 */
export const flushPodEpisodeProgress = async(): Promise<void> => {
  saveProgressNow()
  desiredPlaying = false
  await setPause().catch(() => {})
  await flushPodProgress()
}

/**
 * 起播一集：占队列 → 出声。
 * `startSec` 是「本机记的还差多少」换算出来的起点（原型 `openEpisode` 的那一句），0 = 从头。
 * **第一行就是定时停止播放那道闸**（见上面 `blockedBySleepTimer`）：被拦下时连 `++startToken` 都不做，
 * 免得把在途的上一趟起播无谓作废，快照也一个字段不动。
 */
export const startPodEpisode = async(
  source: PodEpisodeSource,
  options: { startSec?: number, rate?: number } = {},
): Promise<void> => {
  if (blockedBySleepTimer()) return
  const token = ++startToken
  const rate = options.rate ?? lastRate
  const startSec = Math.max(0, Math.round(options.startSec ?? 0))

  lastRate = rate
  stopPoll()
  stopSongWatch()
  // 从这一句起队列归我们重建：先把归属清掉，好让「外部停止」与让位判断在重建途中保持沉默
  activeTrackId = null
  reachedEnd = false
  desiredPlaying = true
  activeSource = source
  lastSavedAt = Date.now()
  commit({
    episodeId: source.episodeId,
    showId: source.showId,
    title: source.title,
    showName: source.showName,
    artworkUrl: source.artworkUrl,
    phase: 'loading',
    position: startSec,
    duration: Math.max(0, Math.round(source.durationHintSec)),
    rate,
    hasUrl: source.url.length > 0,
  })

  if (source.url.length === 0) {
    // 接口没给直链：不放队列、不猜地址（本轮不接订阅源通道），只把播放钮留在原地
    desiredPlaying = false
    commit({ phase: 'failed' })
    return
  }

  ensureEventListeners()
  const trackId = nextTrackId(source.episodeId)
  try {
    if (!isInitialized()) {
      await playerInitial({
        volume: settingState.setting['player.volume'],
        playRate: settingState.setting['player.playbackRate'],
        cacheSize: settingState.setting['player.cacheSize'] ? parseInt(settingState.setting['player.cacheSize']) : 0,
        isHandleAudioFocus: settingState.setting['player.isHandleAudioFocus'],
        isEnableAudioOffload: settingState.setting['player.isEnableAudioOffload'],
      })
    }
    if (token !== startToken) return

    // 停歌（既有能力，理由见文件头第二节第 2 条）
    await setPause()
    if (token !== startToken) return

    // 队列整段清空，再只挂这一集：reset→add 的原生事件里 `track` 缺席，
    // 所以既有 service 的 track-changed 处理会早退，不会对单集做「临时暂停」
    await TrackPlayer.reset()
    if (token !== startToken) return
    await TrackPlayer.add([{
      id: trackId,
      url: source.url,
      title: source.title,
      artist: source.showName,
      artwork: settingState.setting['player.isShowNotificationImage'] && source.artworkUrl.length > 0 ? source.artworkUrl : undefined,
      duration: source.durationHintSec > 0 ? Math.round(source.durationHintSec) : undefined,
    }])
    if (token !== startToken) {
      // 途中有人接手了（多半是让位给了歌曲）。只有队列已经不再归任何一集时，才由我们补一次清理，
      // 免得把接手那一位刚挂上的 track 一起摘掉。
      if (snapshot.episodeId.length === 0) void TrackPlayer.reset().catch(() => {})
      return
    }
    activeTrackId = trackId
    // 队列归我们之后才起步两个看门：认域（轮询/事件里）与歌曲取流
    startSongWatch()

    // 让一拍压过 service 那句异步读指针，再把指针按回初值（第二节第 3 条）
    await sleep(ONE_TICK_MS)
    if (token !== startToken) return
    neutralizeSongPointer()

    if (startSec > 0) await setCurrentTime(startSec)
    if (token !== startToken) return
    await setPlaybackRate(rate)
    if (token !== startToken) return
    // 起播途中用户按过暂停：track 已经挂上，就停在「暂停」这一档，别越过他的意图出声
    if (!desiredPlaying) {
      commit({ phase: 'paused' })
      startPoll()
      return
    }
    await setPlay()
    if (token !== startToken) return

    // 本项目 setupPlayer 关着 autoUpdateMetadata，通知栏得自己喂一次
    await TrackPlayer.updateNowPlayingMetadata({
      title: source.title,
      artist: source.showName,
      artwork: settingState.setting['player.isShowNotificationImage'] && source.artworkUrl.length > 0 ? source.artworkUrl : undefined,
      duration: source.durationHintSec > 0 ? Math.round(source.durationHintSec) : undefined,
    }, true).catch(() => {})
    if (token !== startToken) return

    startPoll()
  } catch {
    if (token !== startToken) return
    // 播放器侧起不来（无网络、解码器拒绝这条直链……）：认作放不出来，屏上那颗钮留在「播放」
    desiredPlaying = false
    activeTrackId = null
    stopPoll()
    stopSongWatch()
    commit({ phase: 'failed' })
  }
}

/** 暂停（真暂停：音频立刻不出声，位置留在原地） */
export const pausePodEpisode = async(): Promise<void> => {
  // 先记下意图：起播序列还在途中（track 尚未挂上）时，它会在出声前自己停住
  desiredPlaying = false
  if (activeTrackId == null) {
    if (snapshot.phase !== 'idle') commit({ phase: 'paused' })
    return
  }
  await setPause().catch(() => {})
  commit({ phase: reachedEnd ? 'ended' : 'paused' })
  saveProgressNow()
}

/**
 * 续播。`ended` 之后按它就从零起（原型 `epToggle`：`if (epState.t >= epSec()) epState.t = 0`）；
 * `failed` 之后按它就是拿原直链重试。
 * 续播同样要出声，所以同一道闸放在第一行（`pausePodEpisode` / `seekPodEpisode` / `setPodEpisodeRate`
 * 都不会让音频开始走，不过闸）。
 */
export const resumePodEpisode = async(): Promise<void> => {
  if (blockedBySleepTimer()) return
  if (activeTrackId == null) return
  desiredPlaying = true
  commit({ phase: 'loading' })
  try {
    if (reachedEnd) {
      reachedEnd = false
      await setCurrentTime(0)
      commit({ position: 0 })
    }
    await setPlay()
    await sleep(ONE_TICK_MS)
    neutralizeSongPointer()
    startPoll()
  } catch {
    desiredPlaying = false
    commit({ phase: 'failed' })
  }
}

/** 跳到第几秒（屏上的「后退十五秒 / 前进三十秒」与拖动进度都由这里落进真音频） */
export const seekPodEpisode = async(sec: number): Promise<void> => {
  if (activeTrackId == null) return
  const target = Math.max(0, Math.round(sec))
  if (reachedEnd && target < snapshot.duration) reachedEnd = false
  commit({ position: target, phase: reachedEnd ? 'ended' : snapshot.phase })
  await setCurrentTime(target).catch(() => {})
}

/** 倍速：既有 `setPlaybackRate`（= `TrackPlayer.setRate`），未起播时先记着，起播时一并生效 */
export const setPodEpisodeRate = async(rate: number): Promise<void> => {
  lastRate = rate
  commit({ rate })
  if (activeTrackId == null) return
  await setPlaybackRate(rate).catch(() => {})
}

/**
 * 交还播放器（用户明确停止 / 退出这类出口）：只有还归这一集时才动手。
 * 落盘 + `reset()` 清空队列 + 把倍速按回既有歌曲设置 + 指针按回初值，快照回 idle。
 *
 * **离场不再走这里**（2026-10-23 跨屏续播）：单集屏卸载只落盘，不交还队列。
 */
export const releasePodEpisode = async(episodeId: string): Promise<void> => {
  if (snapshot.episodeId !== episodeId) return
  await detachQueue()
}

/** 电台这侧此刻是不是正占着播放器（供调用点自查，不参与渲染） */
export const isPodEpisodeActive = (): boolean => activeTrackId != null && snapshot.phase !== 'idle'

/* ================= 远控分派（文件头第三节） ================= */

registerPodRemoteHandlers({
  // 队列归我们、且不是「放不出来」那一档：远控 Play/Pause/Seek 就该作用在这一集上
  isActive: () => activeTrackId != null && snapshot.phase !== 'idle' && snapshot.phase !== 'failed',
  play: () => { void resumePodEpisode() },
  pause: () => { void pausePodEpisode() },
  seek: position => { void seekPodEpisode(position) },
  flush: flushPodEpisodeProgress,
})
