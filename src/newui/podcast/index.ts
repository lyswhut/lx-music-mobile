/**
 * 电台（播客）数据层桶文件。
 *
 * 界面层（U81-U85 那五件）只从这里接：**三个取数函数、六个 hook、本机状态、单集播放、格式化与映射**。
 * URL 模板、AsyncStorage 键位、字段兼容、播放器队列归属都在目录内部收口，不外溢。
 * 本层不含任何组件/屏；文案与样式一律归界面层（见 `PROTOTYPE_INVENTORY.md` 7.6 用词与口径）。
 */
export {
  type PodcastApiErrorKind,
  PodcastApiError,
  fetchPodcastDetail,
  fetchPodcastTopChart,
  isPodcastApiError,
  searchPodcasts,
} from './api'
export {
  extractGenreNames,
  mapChartItem,
  mapChartItems,
  mapEpisodeItem,
  mapLookupResponse,
  mapSearchItems,
  mapShowItem,
  podDateText,
  podDurationText,
  splitLookupResponse,
} from './mappers'
export {
  addPodSub,
  clearPodSearchHistory,
  getPodProgressEntries,
  getPodProgressOf,
  getPodSearchHistory,
  getPodSubs,
  isPodSubscribed,
  loadPodLocalState,
  rememberPodSearch,
  removePodSub,
  savePodProgress,
  subscribePodLocalState,
  togglePodSub,
} from './localState'
export {
  type PodChartState,
  type PodDetailState,
  type PodProgressState,
  type PodSearchState,
  type PodSubsState,
  usePodcastChart,
  usePodcastDetail,
  usePodcastSearch,
  usePodProgress,
  usePodSubs,
} from './hooks'
export {
  type PodEpisodeSource,
  type PodEpisodeTarget,
  type PodPlayerPhase,
  type PodPlayerSnapshot,
  flushPodEpisodeProgress,
  getPodEpisodeTarget,
  getPodPlayerSnapshot,
  isPodEpisodeActive,
  pausePodEpisode,
  releasePodEpisode,
  resumePodEpisode,
  seekPodEpisode,
  setPodEpisodeRate,
  startPodEpisode,
  subscribePodPlayer,
} from './podPlayer'
export { openPodEpisodeScreen } from './episodeRoute'
export { usePodPlayer } from './usePodPlayer'
/** 「播放位里是不是一集播客」的判据与订阅版（原型 `epLive()`）：迷你条画谁、首页横幅让不让位都读它 */
export { isPodEpisodeLive, usePodEpisodeLive } from './usePodEpisodeLive'
export type {
  AppleTopChartItem,
  AppleTopChartResponse,
  ItunesLookupRaw,
  ItunesRawItem,
  ItunesResponse,
  PodDetail,
  PodEpisodeRow,
  PodProgressEntry,
  PodShowRow,
  PodSubEntry,
} from './types'
