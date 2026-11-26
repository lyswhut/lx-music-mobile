import { DEFAULT_SETTING } from '@/config/constant'
import { getSortList } from '@/core/songlist'
import {
  getSongListSetting,
  saveLeaderboardSetting,
  saveSongListSetting,
} from '@/utils/data'

/**
 * 「内容平台」模块级 store（新 UI 唯一读写入口）。
 * 写入口同步更新内存快照并通知订阅者；平台选择只在音源浮层「音乐平台」组做，搜索不读本 store。
 */
export interface NewUiContentPlatform {
  /** 当前内容平台 */
  source: LX.OnlineSource
  /** 歌单目录分类 id（切平台重置回首位「推荐」= 空串） */
  tagId: string
  /** 歌单目录排序 id（切平台重置为目标平台合法默认档） */
  sortId: string
  /** 首次读回持久化设置是否完成（未完成前取数方不应发起目录请求） */
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

/** 该平台的合法默认排序；取不到排序表时退回全局默认。切平台必须重置排序号，否则新平台取数会失败 */
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
        // 历史设置可能错位，读回时按当前平台校验一次，非法即重置
        const fixed = normalizePlatformFields(source, tagId, sortId)
        current = { source, ...fixed, ready: true }
      } else current = { ...current, ready: true }
    })
    .catch(() => {
      // 存储读失败按默认平台继续
      current = { ...current, ready: true }
    })
    .finally(() => {
      loading = false
      notify()
    })
}

/**
 * 写当前内容平台（新 UI 唯一写入口）：歌单目录与榜单目录两个设置一起写，写入后立即脉冲。
 * 切平台必须连同排序号与分类一起重置。
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

/** 订阅变化（订阅即触发一次读盘） */
export const subscribeContentPlatform = (listener: Listener): (() => void) => {
  listeners.add(listener)
  load()
  return () => {
    listeners.delete(listener)
  }
}
