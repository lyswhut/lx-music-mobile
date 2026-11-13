import { DEFAULT_SETTING } from '@/config/constant'
import { getSortList } from '@/core/songlist'
import {
  getSongListSetting,
  saveLeaderboardSetting,
  saveSongListSetting,
} from '@/utils/data'

/**
 * 「内容平台」模块级 store（新 UI 唯一读写入口）。
 *
 * 背景（2026-10-12 真机走查：音源浮层平台选不了，首页恒为「酷我」）：
 * 首页推荐歌单 / 首页榜单 tab / 歌单页分类与池子的取数都读持久化设置
 * `getSongListSetting()` / `getLeaderboardSetting()`（默认 source 'kw'），
 * 而这两个设置**只有旧界面会写**，新 UI 从未写过 → 永远停在默认值。
 * 又因为 `save*Setting` 只写存储、不发任何事件（utils/data.ts L253-268），
 * 已打开的页面感知不到变化 —— 所以在这里补一层「写 + 脉冲」：
 * 写入口同步更新内存快照并通知订阅者，读取侧（hooks/useContentPlatform）
 * 经 useSyncExternalStore 拿到新值后各取数 hook 自动重取。
 *
 * 口径（用户 2026-10-12 拍板）：平台选择只在音源浮层「音乐平台」组做，
 * 页面内不回显当前平台；跟随范围 = 首页推荐歌单 / 首页热门单曲 / 歌单页 /
 * 排行榜页的**卡片排序**（当前平台的榜排最前，五平台仍全列，只排序不折叠不隐藏）。
 * 搜索维持全平台并发，**不读本 store**。
 *
 * 可选性与音源无关的依据：歌单/榜单目录由内置 SDK 直连平台公开接口
 * （core/songlist.ts L31/L80、core/leaderboard.ts L38 → utils/musicSdk/<source>/…），
 * 音源只决定取不取得到播放地址 —— 所以平台行都能选，未覆盖只是行内提示。
 */
export interface NewUiContentPlatform {
  /** 当前内容平台 */
  source: LX.OnlineSource
  /** 歌单目录分类 id（切平台随目录整体换血重置回首位「推荐」= 空串不掺口味；读回时非法残留一并清掉） */
  tagId: string
  /** 歌单目录排序 id（切平台重置为目标平台合法默认档，见 defaultSortIdOf） */
  sortId: string
  /** 首次读回持久化设置是否完成（未完成前取数方不应发起目录请求，避免默认值双取） */
  ready: boolean
}

let current: NewUiContentPlatform = {
  source: DEFAULT_SETTING.songList.source,
  tagId: DEFAULT_SETTING.songList.tagId,
  sortId: DEFAULT_SETTING.songList.sortId,
  ready: false,
}

type Listener = () => void
const listeners = new Set<Listener>()

const notify = () => {
  for (const listener of listeners) listener()
}

let loading = false
/** 读回期间用户已在浮层点了平台（写入口优先，读回的旧值不得覆盖回来） */
let dirty = false

/**
 * 排序表按平台各异（内置 SDK 各 songList.sortList：kw new/hot、wy 仅 hot、
 * tx -1/3/2、kg 5/6/7/3、mg 是栏目号），旧界面切平台时同样重置为新平台第一档
 * （src/screens/Home/Views/SongList/Content.tsx handleSourceChange）。
 * 切平台不换 sortId 会让新平台拿到认不出的排序号：wy 收到非 200 重试到
 * 'try max num'、tx parseInt('new') 得 NaN 请求即坏——歌单页池子空/报错，
 * 读起来就是「网易云下歌单页显示不出来」（2026-10-12 真机走查现象 3 根因）。
 */
/** 该平台的合法默认排序（取不到排序表时退回全局默认，不阻塞） */
const defaultSortIdOf = (source: LX.OnlineSource): string =>
  getSortList(source)?.[0]?.id ?? DEFAULT_SETTING.songList.sortId

/** 该平台的排序表里是否有这个排序号 */
const isSortIdValidFor = (source: LX.OnlineSource, sortId: string): boolean =>
  getSortList(source)?.some(item => item.id === sortId) ?? false

/** 读回或写入时统一收口：排序号不属于该平台就连同分类一起重置 */
const normalizePlatformFields = (
  source: LX.OnlineSource,
  tagId: string,
  sortId: string,
): { tagId: string, sortId: string } =>
  isSortIdValidFor(source, sortId)
    ? { tagId, sortId }
    : { tagId: '', sortId: defaultSortIdOf(source) }

/** 只从存储读一次（幂等）；读回或失败后 ready 置真并通知 */
const load = () => {
  if (current.ready || loading) return
  loading = true
  void getSongListSetting()
    .then(({ source, tagId, sortId }) => {
      // 读回期间已被写过（冷启动立刻开浮层抢点）：保留写入值，只补 ready
      if (!dirty) {
        // 历史版本可能存着「上个平台的排序号 + 分类」的错位设置（切平台不重置是
        // 本轮修掉的缺陷），读回时按当前平台校验一次，非法即重置
        const fixed = normalizePlatformFields(source, tagId, sortId)
        current = { source, ...fixed, ready: true }
      } else current = { ...current, ready: true }
    })
    .catch(() => {
      // 存储读失败按默认平台继续：目录请求成不成各有 hook 的 error 口径兜底
      current = { ...current, ready: true }
    })
    .finally(() => {
      loading = false
      notify()
    })
}

/**
 * 写当前内容平台（新 UI 唯一写入口）：
 * 歌单目录与榜单目录两个设置一起写（平台选择对两者同口径生效），
 * 再点当前平台不重复写；写入后立即脉冲，已打开的页面重取数据。
 * **切平台必须连同排序号与分类一起重置**（口径照抄旧界面的平台切换）：
 * 每个平台的歌单排序表与分类目录各不相同，留着上一个平台的值会让新平台
 * 取数直接失败（2026-10-12 真机走查现象 3，网易云歌单页空白的根因）。
 */
export const setContentPlatformSource = (source: LX.OnlineSource) => {
  if (current.source === source) return
  const sortId = defaultSortIdOf(source)
  current = { ...current, source, sortId, tagId: '' }
  dirty = true
  void saveSongListSetting({ source, sortId, tagId: '', tagName: '' })
  void saveLeaderboardSetting({ source })
  notify()
}

/** 快照（同步、引用稳定：只有读回/切平台才换新对象） */
export const getContentPlatformSnapshot = (): NewUiContentPlatform => current

/** 订阅变化（订阅即触发一次读盘，与 utils/recentPlay 同法） */
export const subscribeContentPlatform = (listener: Listener): (() => void) => {
  listeners.add(listener)
  load()
  return () => {
    listeners.delete(listener)
  }
}
