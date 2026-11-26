import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BackHandler,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { Navigation } from 'react-native-navigation'

import { FixedWindowList } from '@/newui/components/FixedWindowList/FixedWindowList'

import { LIST_IDS } from '@/config/constant'
import { clearListDetail, getListDetail, setListDetail, setListDetailInfo } from '@/core/songlist'
// rank 形态数据分支：core/leaderboard 是另一套取数 API（id={source}__{bangId}），
// 分页 store 也独立（store/leaderboard），别名单引避免与 songlist 同名函数交叉污染
import {
  clearListDetail as clearBoardListDetail,
  getListDetail as getBoardListDetail,
  setListDetail as setBoardListDetail,
  setListDetailInfo as setBoardListDetailInfo,
} from '@/core/leaderboard'
import { handleCollect, handlePlay } from '@/screens/SonglistDetail/listAction'
import {
  handleCollect as handleBoardCollect,
  handlePlay as handleBoardPlay,
} from '@/screens/Home/Views/Leaderboard/listAction'
// local 形态取数与播放：core/list.getListMusics（内部自带缓存）+ core/player.playList，
// 口径照抄旧「我的歌单」列表屏
import { getListMusics, removeUserList } from '@/core/list'
import { playList } from '@/core/player/player'
import boardState from '@/store/leaderboard/state'
import songlistState, { type ListInfoItem } from '@/store/songlist/state'

// 直连 entry 而非 '@/newui/navigation' 桶口：避免 navigation/index → register → 本文件的循环引用
import { pushNewUiPlayer } from '@/newui/navigation/entry'

import {
  ConfirmSheet,
  CoverWash,
  EmptyTip,
  PagingEnd,
  PagingStatus,
  pickArtPalette,
  PlActions,
  PlTop,
  SongRow,
  NewUiToastHost,
} from '@/newui/components'
import {
  getPlatformMeta,
  NEW_UI_BOARD_LIST_ID_PREFIX,
  NEW_UI_PAGING_END_TEXT,
  NEW_UI_PLD_DELETE_CONFIRM,
  NEW_UI_PLD_EMPTY,
  NEW_UI_PLD_EMPTY_BY_OWNER,
  NEW_UI_PLD_LABELS,
  NEW_UI_PLD_LOAD_TIMEOUT_MS,
  NEW_UI_PLD_STATUS,
  NEW_UI_PLD_TAG_EMPTY_FAV,
  NEW_UI_PLD_TAG_PENDING,
  NEW_UI_PLD_TOAST,
  NEW_UI_PLAYLIST_ART_SEED,
  newUiPlCrumb,
  newUiPlayableTag,
  type NewUiPlaylistOwner,
  type NewUiSonglistDetailKind,
  type NewUiTabKey,
} from '@/newui/const'
import {
  useApiSupport,
  useLayerAppeared,
  useMyPlaylists,
  useNewUiSystemBar,
  useNowPlaying,
  useSafeArea,
  useWideLayout,
} from '@/newui/hooks'
import {
  PL_LAYER,
  SONG_ROW,
  Z_LAYER,
  useTheme,
} from '@/newui/theme'
import { isDeletableUserListId, requestNewUiTab, showNewUiToast, toSongDisplay, withTimeout } from '@/newui/utils'

import { PlaylistHero } from './PlaylistHero'
// 单曲操作面板与主屏同款（组件共通，挂各屏根层）
import { MoreSheet } from '@/newui/screens/Main/sheets'

export interface SonglistDetailScreenProps {
  componentId: string
  /** 歌单坐标与已知信息；平台形态必传，local 形态不传 */
  info?: ListInfoItem
  /** 形态（取数链路与按钮能力）；缺省 pl。平台导入的自建卡传 mine，纯本地歌单传 local，
   *  内置「我喜欢」传 fav。文案不看 kind，按归属 owner 取（见屏内 ownerOf） */
  kind?: NewUiSonglistDetailKind
  /** local / fav 形态必传：本地歌单 id（store/list 的 allList 项，非平台坐标） */
  listId?: string
  /** local / fav 形态：本地歌单名（头部先行展示，与入口卡片一致） */
  listName?: string
  /** 来源 Tab：从哪个主屏 Tab 推入本层，返回时先切回该 Tab 再 pop；
   * 非 Tab 页入口（如搜索层）不传，返回直接 pop */
  fromTab?: NewUiTabKey
}

/** 层内分页状态 */
type LoadStatus = 'loading' | 'idle' | 'end' | 'error'

/** 转场期占位曲目：appear 后再换真数据 */
const NO_TRACKS: LX.Music.MusicInfo[] = []

/** 头部展示信息：passProps 先行，平台返回后补齐 */
interface DetailHeaderInfo {
  name: string
  desc: string
  author: string
  img?: string
  playCount: string
}

/**
 * 歌单详情层：全屏右推，整层单滚动容器（顶排 + hero + 操作排进 FlatList 头部）。
 * 数据只读复用，按 kind 切对应旧 API：
 * - pl / mine —— core/songlist 分页取歌（含 LIMIT 分页缓存）；播放走 SonglistDetail/listAction.handlePlay
 *   （先播已载队列，全量取回后升级临时队列）；收藏为真 toggle：未存走 handleCollect 全量导入，
 *   已存走 core/list.removeUserList 移出。
 * - rank —— 榜单 id 为 {source}__{bangId}，取数 / 分页 store 换 core/leaderboard；
 *   播放走 Leaderboard/listAction.handlePlay；收藏语义 = 把整张榜存进我的歌单。
 * - local —— 本地歌单：core/list.getListMusics 整单一次取全（无分页），订阅 myListMusicUpdate 就地刷新；
 *   播放走 core/player.playList（队列即这份歌单）；右上一格改放「删除本歌单」（仅可删单子）。
 * fav 与 local 走同一条取数链路，差异只在文案与 hero 胶囊。
 * 文案 / 页脚 / 空态 / 右上钮一律按归属 owner（fav/own/rank/collected/platform）取，不看入口 kind。
 */
export const SonglistDetailScreen = ({
  componentId,
  info,
  kind = 'pl',
  listId = '',
  listName = '',
  fromTab,
}: SonglistDetailScreenProps) => {
  const theme = useTheme()
  const { top, bottom } = useSafeArea()
  const { wide, layerPaddingX } = useWideLayout()
  useNewUiSystemBar(componentId)

  /**
   * 转场期只放行头部：首帧同时挂头部 + 首屏歌曲会与入场转场抢 UI 线程帧，
   * 且空列表内容比视口矮会提前判触底，故等本层 appear 后再渲染列表。
   */
  const opened = useLayerAppeared(componentId)

  const assertApiSupport = useApiSupport()
  const nowPlaying = useNowPlaying()
  const myLists = useMyPlaylists()

  const [tracks, setTracks] = useState<LX.Music.MusicInfo[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [total, setTotal] = useState(Number(info?.total) || 0)
  const [headerInfo, setHeaderInfo] = useState<DetailHeaderInfo>(() => ({
    // local 形态没有平台头部信息，名字用入口卡片带过来的 listName，其余如实留空
    name: info?.name ?? listName,
    desc: info?.desc ?? '',
    author: info?.author ?? '',
    img: info?.img,
    playCount: info?.play_count ?? '',
  }))

  const isUnmountedRef = useRef(false)
  // 翻页请求在途闸：原生 onEndReached 与补判可能先后触发，
  // status 还没翻新时靠它挡住重复取同一页
  const pageBusyRef = useRef(false)
  // —— 翻页游标由本屏自己记录 ——
  // 不从进程内共享、会被就地改写的分页仓反推页码（仓被兜底清空后与入口坐标比对必然失败，
  // loadNext 会静默 return，屏幕停在已到手的一批且永不复活）。
  // pageRef：最后一次成功取到的页码（0 = 首屏未落），失败不推进，重试仍打同一页。
  const pageRef = useRef(0)
  // maxPageRef：平台报的总页数快照（成功时写），判「还有没有下一页」只看本屏这一份
  const maxPageRef = useRef(0)
  // reqSeqRef：请求代次令牌，只有最新一代的 settle 才允许落 state / 推游标 / 复位闸门，
  // 迟到响应整份作废（写法照 usePlaylistPool）
  const reqSeqRef = useRef(0)
  // 收藏全量导入进行中标记（防连点重复抓全量，见 handleFavPress）
  const favBusyRef = useRef(false)
  // 删除已确认落库标记：置真后本页不再回读这张已经不存在的单子（见 loadLocalList / handleDeletePress）
  const deletedRef = useRef(false)
  // 删除确认弹窗 / 写入进行中标记：连点不叠第二个弹窗，也不重复发删除
  const deleteBusyRef = useRef(false)

  // 单曲操作面板目标
  const [moreMusic, setMoreMusic] = useState<LX.Music.MusicInfo | null>(null)
  // 删单二次确认的目标单名
  const [deleteConfirmName, setDeleteConfirmName] = useState<string | null>(null)

  // rank 形态开关：取数 / 分页 store / 播放收藏动作整套换走（见文件头注释），pl / mine 行为不变
  const isRank = kind === 'rank'
  // local 形态开关：取数换 core/list、播放换 playList，右上一格改放删除钮。
  // 内置「我喜欢」(fav) 与 local 数据链路相同，一并走这套；差异只在文案与 hero 胶囊。
  // 删除钮不受影响——LOVE 是系统列表，isDeletableUserListId 恒假，这一位仍是同尺寸空槽。
  const isFav = kind === 'fav'
  const isLocal = kind === 'local' || isFav

  const loadPage = useCallback((page: number) => {
    // local 形态整单一次取全（见 loadLocalList），不进平台分页 API
    if (isLocal || info == null) return
    // 代次令牌：本次请求的身份，四个 settle 回调开头都按它作废过期响应（见 reqSeqRef 注释）
    const seq = ++reqSeqRef.current
    pageBusyRef.current = true
    setStatus('loading')
    if (isRank) {
      // 榜单明细无头部信息字段，hero 全程用 passProps。
      // 超时护栏：网络挂死时 Promise 可能永不 settle，到限走 error 分支给重试入口
      void withTimeout(getBoardListDetail(info.id, page), NEW_UI_PLD_LOAD_TIMEOUT_MS)
        .then(result => {
          if (seq !== reqSeqRef.current) return
          // 闸门复位必须排在卸载判定之前：否则页面存活、这一发是重挂载前的迟到响应时，
          // 闸门会被永久留在「在途」
          pageBusyRef.current = false
          if (isUnmountedRef.current) return
          // 合并写回 leaderboard 分页 store 后取快照落 state
          const merged = setBoardListDetail(result, info.id, page)
          setTotal(merged.total)
          setTracks([...merged.list])
          pageRef.current = page
          maxPageRef.current = merged.maxPage
          setStatus(merged.maxPage <= page ? 'end' : 'idle')
        })
        .catch(() => {
          if (seq !== reqSeqRef.current) return
          pageBusyRef.current = false
          if (isUnmountedRef.current) return
          // 首页失败且 store 里已有残页时清掉，避免下页错位；
          // 本屏不以该仓作翻页依据，清不清都不影响续取，故保留原兜底
          if (boardState.listDetailInfo.list.length && page == 1) clearBoardListDetail()
          setStatus('error')
        })
      return
    }
    // 超时护栏：同上
    void withTimeout(getListDetail(info.id, info.source, page), NEW_UI_PLD_LOAD_TIMEOUT_MS)
      .then(result => {
        if (seq !== reqSeqRef.current) return
        pageBusyRef.current = false
        if (isUnmountedRef.current) return
        // setListDetail 返回的就是 store 对象本体，取快照落 state（分页合并 / 去重已在 store 内做）
        const merged = setListDetail(result, info.id, page)
        setTotal(merged.total)
        setTracks([...merged.list])
        pageRef.current = page
        maxPageRef.current = merged.maxPage
        setHeaderInfo({
          name: info.name || merged.info.name || '',
          desc: merged.info.desc || info.desc || '',
          // author 需兜底：平台明细与 passProps 同时缺它时 undefined 会传进
          // PlaylistHero 的 sub.length 直接炸渲染
          author: merged.info.author || info.author || '',
          img: info.img ?? merged.info.img,
          playCount: (info.play_count ?? merged.info.play_count) ?? '',
        })
        setStatus(merged.maxPage <= page ? 'end' : 'idle')
      })
      .catch(() => {
        if (seq !== reqSeqRef.current) return
        pageBusyRef.current = false
        if (isUnmountedRef.current) return
        // 首页失败且 store 里已有残页时清掉，避免下页错位
        if (songlistState.listDetailInfo.list.length && page == 1) clearListDetail()
        setStatus('error')
      })
  }, [info, isLocal, isRank])

  // —— local 形态取数：只读复用 core/list.getListMusics（自带缓存，重开秒回）；
  // 曲目增删走 myListMusicUpdate 就地刷新。
  // deletedRef 为真时不回读：单子已删，此时该事件也会带着这个 id 广播回来，
  // 再读一次会把空表写进 core 的曲目缓存。
  const loadLocalList = useCallback(() => {
    if (listId === '' || deletedRef.current) return
    void getListMusics(listId)
      .then(musics => {
        if (isUnmountedRef.current) return
        setTracks([...musics])
        setStatus('end')
      })
      .catch(() => {
        if (isUnmountedRef.current) return
        setStatus('error')
      })
  }, [listId])

  // 打开即重取首页：两套 getListDetail 内部都自带分页缓存，重复打开秒回；
  // 先重置对应 store 的详情态再拉取（leaderboard 版签名不同，内部先 clear）
  useEffect(() => {
    if (isLocal || info == null) return
    isUnmountedRef.current = false
    // 进层游标归零，从第 1 页重取；闸门一并放开（上一代在途请求由代次令牌作废）
    pageRef.current = 0
    maxPageRef.current = 0
    pageBusyRef.current = false
    if (isRank) setBoardListDetailInfo(info.id)
    else setListDetailInfo(info.source, info.id)
    void loadPage(1)
    return () => {
      isUnmountedRef.current = true
      // rank 形态关闭清场：leaderboard 分页 store 与旧榜单视图共用，不留残页防串台
      if (isRank) clearBoardListDetail()
    }
  }, [info, isLocal, isRank, loadPage])

  // local 形态挂载：首取 + 订阅本单曲目变化；卸载退订（试听 / 收藏 / 自建一视同仁）
  useEffect(() => {
    if (!isLocal || listId === '') return
    isUnmountedRef.current = false
    deletedRef.current = false
    loadLocalList()
    const handleMusicUpdated = (ids: string[]) => {
      if (ids.includes(listId)) loadLocalList()
    }
    global.app_event.on('myListMusicUpdate', handleMusicUpdated)
    return () => {
      isUnmountedRef.current = true
      global.app_event.off('myListMusicUpdate', handleMusicUpdated)
    }
  }, [isLocal, listId, loadLocalList])

  const loadNext = useCallback(() => {
    // local 整单在手，无下一页
    if (isLocal || info == null) return
    // 在途闸门：此时页脚已在显示「正在载入下一批…」，不再发请求
    if (pageBusyRef.current) return
    // 页码由本屏自己记：游标只在成功落定时推进，所以要么重取未到手的那页（首屏失败过 → 仍是 0），
    // 要么续下一页；不会跳页（core 页缓存按「上一页」推源页，跳页会整页漏歌）
    const page = pageRef.current + 1
    // 判到没有下一页时显式收尾 end，让用户看到「没有更多了」。
    // page 等于 maxPage 仍需请求（那是最后一页），只有超过才真正没有；
    // maxPageRef 为 0 说明本屏还没落过页，不参与判定。
    if (maxPageRef.current > 0 && maxPageRef.current < page) {
      setStatus('end')
      return
    }
    void loadPage(page)
  }, [info, isLocal, loadPage])

  /** 首屏失败的重试入口（页脚 EmptyTip）：闸门挡住连点重试留下两条并存的第 1 页请求 */
  const handleRetryPress = useCallback(() => {
    if (pageBusyRef.current) return
    // local 形态重读本地整单（loadPage 不吃 local），与旧行为一致
    if (isLocal) {
      loadLocalList()
      return
    }
    void loadPage(1)
  }, [isLocal, loadLocalList, loadPage])

  const handleEndReached = useCallback(() => {
    // 转场期列表为空、内容比视口矮，会立刻判触底；放行会提前多取第 2 页
    if (!opened) return
    if (pageBusyRef.current) return
    if (status === 'loading' || status === 'end') return
    loadNext()
  }, [loadNext, opened, status])

  // 行高 = paddingY×2 + 封面 46 + 根节点上下各 1px 透明描边 = 62，行距 listGap 2；
  // FixedWindowList 按这两个值算位，改 SongRow 的 padding / 封面 / 描边时必须同步，否则滚动位置会漂
  const PLD_ROW_HEIGHT = SONG_ROW.paddingY * 2 + SONG_ROW.artSize + 2
  const PLD_ROW_GAP = SONG_ROW.listGap

  /** 统一返回：有来源 Tab 先向存活主屏投递再 pop，否则直接 pop（utils/tabJump 通道，不新造路由） */
  const goBack = useCallback(() => {
    if (fromTab != null) requestNewUiTab(fromTab)
    void Navigation.pop(componentId)
  }, [componentId, fromTab])

  /** 硬件返回键显式接管（RNN 默认 pop 在真机落位不稳）：统一走 goBack。
   * 浮层可见时其监听注册更晚、RN 后注册先消费，故先关浮层、不会连带退页。 */
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack()
      return true
    })
    return () => { subscription.remove() }
  }, [goBack])

  const closeMore = useCallback(() => setMoreMusic(null), [])

  // —— 可播口径：tracks 中平台支持的曲目 ——
  const playable = useMemo(
    () => tracks.filter(song => assertApiSupport(song.source)),
    [assertApiSupport, tracks],
  )
  // 分母优先取平台报的总数（分页下已载部分不足以做分母），拿不到才用已载数
  const totalCount = total > 0 ? total : tracks.length
  // 首批曲目未到时 tracks 为空，任何计数都是虚报；此时不报计数，只回显平台，按 pending 态处理
  const tracksPending = tracks.length === 0 && status === 'loading'
  const metaTag = isRank && info != null
    ? getPlatformMeta(info.source).label
    : tracksPending
      ? (info?.source != null ? getPlatformMeta(info.source).label : NEW_UI_PLD_TAG_PENDING)
      : isFav && tracks.length === 0
        // 空收藏不报「0/0 首可播」，改成如实一句
        ? NEW_UI_PLD_TAG_EMPTY_FAV
        : newUiPlayableTag(totalCount)
  const metaParts = useMemo(() => {
    const parts: string[] = []
    // rank / local 都如实显示已载或全量首数；首批未在手时不报数
    if ((isRank || isLocal) && !tracksPending) parts.push(`${tracks.length} 首`)
    if (headerInfo.playCount) parts.push(`${headerInfo.playCount}播放`)
    return parts
  }, [headerInfo.playCount, isLocal, isRank, tracks.length, tracksPending])

  // 封面种子：local 与入口「我的歌单」卡片同种子（mypl:listId），页内页外底图一致；
  // 本地歌单无平台封面图时，hero 与氛围底纹都回落在这颗种子的程序化纹理上
  const artSeed = isLocal
    ? `${NEW_UI_PLAYLIST_ART_SEED.mine}:${listId}`
    : `${info?.source ?? ''}__${info?.id ?? ''}`
  const [bgC1, bgC2] = useMemo(() => pickArtPalette(artSeed), [artSeed])

  /**
   * hero 封面：只有 local 形态跟着第一首走（与入口卡面同口径，进层后头图是同一张），空单回落种子。
   * fav 走内置版式，平台 / rank 用 headerInfo.img；氛围底纹对所有形态都用 palette(artSeed)。
   */
  const localHero = kind === 'local' && tracks.length > 0
    ? toSongDisplay(tracks[0], true)
    : null
  const heroArtSeed = localHero?.artSeed ?? artSeed
  const heroArtUri = kind === 'local' ? localHero?.artUri : headerInfo.img

  // 收藏态 = 已进「我的歌单」（用本地歌单存在性映射）。
  // rank 按存榜坐标匹配：sourceListId = `board__${榜单 id}`，直接比 info.id 永远对不上。
  // local 形态没有心钮，此判定恒不命中。
  const collectedSourceListId = info == null
    ? undefined
    : isRank ? `${NEW_UI_BOARD_LIST_ID_PREFIX}${info.id}` : info.id
  // 命中的那份歌单本体（不只判存在）：已收藏时再点心钮 = 移出，需要它的本地 id 走 removeUserList
  const collectedList = useMemo(
    () => (info == null || collectedSourceListId == null
      ? undefined
      : myLists.find(list => list.source === info.source && list.sourceListId === collectedSourceListId)),
    [collectedSourceListId, info, myLists],
  )
  const collected = collectedList != null

  /**
   * 归属 owner：顶上文案、页脚、空态、右上钮一律看它，不看入口 kind（kind 只管取数链路与按钮能力）。
   *   fav       —— 内置「我喜欢」，固定 listId（LOVE），先于 own 判定；
   *   own       —— 纯自建，无平台坐标的本机单子；
   *   rank      —— 整榜（含从「我的歌单」点进来的「存整榜」，入口已剥掉 board__ 前缀）；
   *   collected —— 平台单且已在本机 userList（source + sourceListId 命中）；
   *   platform  —— 平台单还没收。
   * 收藏关系命中用 collectedList（myLists 订阅 mylistUpdated），页内收藏后标题会当场变化。
   */
  const owner: NewUiPlaylistOwner = listId === LIST_IDS.LOVE || isFav
    ? 'fav'
    : isLocal
      ? 'own'
      : isRank
        ? 'rank'
        : collectedList != null ? 'collected' : 'platform'

  // —— 动作：均走旧屏同款 handlePlay 队列升级（先播已载，全量取回后升级临时队列）——
  // pl / mine = SonglistDetail/listAction；rank = Leaderboard/listAction；local = playList（队列即本歌单）。
  // index 指「可播子集」里的序号，local 需换算回它在整单里的位置。
  // playable 的平台三形态来源恒为在线曲目，断言只是补 TS 窄化
  const playAt = useCallback((index: number) => {
    if (isLocal) {
      const song = playable[index]
      if (song != null) void playList(listId, tracks.indexOf(song))
      return
    }
    if (info == null) return
    const onlinePlayable = playable as LX.Music.MusicInfoOnline[]
    void (isRank
      ? handleBoardPlay(info.id, onlinePlayable, index)
      : handlePlay(info.id, info.source, onlinePlayable, index))
  }, [info, isLocal, isRank, listId, playable, tracks])

  const handlePlayAll = useCallback(() => {
    if (!playable.length) {
      showNewUiToast(NEW_UI_PLD_TOAST.playAllEmpty)
      return
    }
    playAt(0)
  }, [playAt, playable])

  const handleShuffle = useCallback(() => {
    if (!playable.length) {
      showNewUiToast(NEW_UI_PLD_TOAST.playAllEmpty)
      return
    }
    const pick = Math.floor(Math.random() * playable.length)
    playAt(pick)
    // 随机播放后直接打开播放页
    void pushNewUiPlayer(componentId)
  }, [componentId, playAt, playable])

  const handleSongPress = useCallback((index: number) => {
    const song = tracks[index]
    if (song == null) return
    if (!assertApiSupport(song.source)) {
      showNewUiToast(NEW_UI_PLD_TOAST.unplayable(getPlatformMeta(song.source).label))
      return
    }
    // 队列给可播子集，行号换算成其在队列里的位置（必在其中）
    playAt(playable.indexOf(song))
  }, [assertApiSupport, playAt, playable, tracks])

  const handleFavPress = useCallback(() => {
    // local 形态没有心钮（本单已在「我的歌单」里，存单动作没有意义），此处只为类型收口再加一道闸
    if (isLocal || info == null) return
    // 真 toggle：已存 → core/list.removeUserList 移出（不另写存储）；
    // 未存 → 按 kind 走旧 listAction 的整榜 / 整单全量导入。
    // 前置拦住后不会触发旧 collect 的「重复收藏确认」系统弹窗。
    if (collectedList) {
      void removeUserList([collectedList.id])
        .then(() => { showNewUiToast(NEW_UI_PLD_TOAST.favRemoved) })
        .catch(() => { showNewUiToast(NEW_UI_PLD_TOAST.favFailed) })
      return
    }
    // 导入进行中的连点拦截：全量取歌动辄几十秒，期间 collected 还没翻 true，
    // 不设闸会把同一份榜再全量抓一遍
    if (favBusyRef.current) return
    favBusyRef.current = true
    // 全量导入可能几十秒：按下先给长 toast，成功 toast 由旧 listAction 内部发，失败兜底报错
    showNewUiToast(isRank ? NEW_UI_PLD_TOAST.boardSaving : NEW_UI_PLD_TOAST.favSaving, 'long')
    void (isRank
      ? handleBoardCollect(info.id, headerInfo.name || info.name, info.source)
      : handleCollect(info.id, info.source, headerInfo.name || info.name)
    )
      .catch(() => { showNewUiToast(NEW_UI_PLD_TOAST.favFailed) })
      .finally(() => { favBusyRef.current = false })
  }, [collectedList, headerInfo.name, info, isLocal, isRank])

  // —— 本地歌单删除：可删判定按 id（isDeletableUserListId，系统列表不在 userList 里）——
  // 只有 own（纯自建）才谈得上「删这份单子」；收藏来的平台单删不掉平台侧那张，只能移出收藏。
  const canDeleteList = owner === 'own' && isDeletableUserListId(listId)

  // 单曲「⋯」面板的宿主单：kind==='local' 且可删时传 id + 名字，
  // 面板据此插「从「该单」移出」一行；其余形态一概不传
  const isHostLocalList = kind === 'local' && isDeletableUserListId(listId)

  const handleDeletePress = useCallback(() => {
    if (!canDeleteList || deleteBusyRef.current) return
    // 二次确认走共通件 ConfirmSheet；只落确认态，取消则单子、曲目、页面一概不动
    setDeleteConfirmName(headerInfo.name || listName)
  }, [canDeleteList, headerInfo.name, listName])

  /** 确认浮层右键后的真删除（名字由确认态在开层那一帧的闭包带入，与点按目标一致） */
  const runDelete = useCallback((name: string) => {
    deleteBusyRef.current = true
    // 删除只走 core/list.removeUserList：持久化 + mylistUpdated + 清歌目记录 + 激活回落，
    // 一条链做完，本页不另写任何存储或状态清理
    deletedRef.current = true
    void removeUserList([listId])
      .then(() => {
        if (isUnmountedRef.current) return
        showNewUiToast(NEW_UI_PLD_TOAST.listDeleted(name))
        // 单子已不存在，留空壳页没有意义：删完退出详情层，
        // 走统一 goBack（有来源 Tab 时落回那张卡所在的 Tab）
        goBack()
      })
      .catch(() => {
        // 失败不静默：撤销「不再回读」的标记，用户还可以在原页面重试
        deletedRef.current = false
        showNewUiToast(NEW_UI_PLD_TOAST.listDeleteFailed)
      })
      .finally(() => { deleteBusyRef.current = false })
  }, [goBack, listId])

  // 行渲染对两种来源同一套（SongRow / toSongDisplay 都吃 MusicInfo 联合类型，本地文件天然支持）
  const renderItem = useCallback((item: LX.Music.MusicInfo, index: number) => {
    const playableSong = assertApiSupport(item.source)
    const active = nowPlaying.id === item.id
    return (
      <SongRow
        {...toSongDisplay(item, playableSong)}
        // 明细接口没带逐曲封面时（酷我），行内共通补图
        musicInfo={item}
        active={active}
        playing={active && nowPlaying.playing}
        dimmed={!playableSong}
        onPress={() => { handleSongPress(index) }}
        // 歌曲行右侧 ⋯
        onMore={() => setMoreMusic(item)}
      />
    )
  }, [assertApiSupport, handleSongPress, nowPlaying.id, nowPlaying.playing])

  const keyExtractor = useCallback((item: LX.Music.MusicInfo) => item.id, [])

  // 内容留白样式缓存：避免每次重渲染都把新对象下发给 VirtualizedList，触发整块重布局。
  // 本屏是整层滚动（头部三排在 ListHeader 里跟着滚），档位只落在这一个 contentContainer 上；
  // compact 档两个 `??` 都回竖屏基线（PL_LAYER.paddingTopReserve / paddingX）。
  const listContentStyle = useMemo(() => ({
    paddingTop: top + (wide?.statusReserve ?? PL_LAYER.paddingTopReserve),
    paddingHorizontal: layerPaddingX ?? PL_LAYER.paddingX,
    paddingBottom: PL_LAYER.paddingBottom + bottom,
  }), [top, bottom, wide, layerPaddingX])

  // 头部三排（顶排 / hero / 操作排）随列表整体滚
  const listHeader = (
    <View>
      {/* 顶排：返回钮 + 面包屑 + 右上一格 */}
      <PlTop
        // 面包屑按归属取：收藏单补平台全名，其余各自一句
        crumbText={newUiPlCrumb(owner, info?.source)}
        backLabel={NEW_UI_PLD_LABELS.back}
        onBack={goBack}
        // 右上格按归属分：own → 可删单子给「删除本歌单」，否则空槽；fav → 空槽；
        // collected / platform / rank → 收藏心钮（已收 → 按下移出；rank 收起整榜）
        right={
          owner === 'own'
            ? (canDeleteList
              ? { kind: 'delete', onPress: handleDeletePress, label: NEW_UI_PLD_LABELS.deleteList }
              : { kind: 'none' })
            : owner === 'fav'
              ? { kind: 'none' }
              : {
                  kind: 'fav',
                  collected,
                  onPress: handleFavPress,
                  label: owner === 'rank'
                    ? (collected ? NEW_UI_PLD_LABELS.unfavBoard : NEW_UI_PLD_LABELS.favBoard)
                    : (collected ? NEW_UI_PLD_LABELS.unfav : NEW_UI_PLD_LABELS.fav),
                }
        }
      />

      <PlaylistHero
        artSeed={heroArtSeed}
        artUri={heroArtUri}
        name={headerInfo.name}
        sub={headerInfo.desc || headerInfo.author}
        metaTag={metaTag}
        metaParts={metaParts}
        isChart={isRank}
      />

      {/* 操作排：播放全部 + 随机 */}
      <PlActions
        // 首批未在手时不跟虚报的「0 首」；取回后如实标可播数
        playAllLabel={`${NEW_UI_PLD_LABELS.playAll}${tracksPending ? '' : ` ${playable.length} 首`}`}
        onPlayAll={handlePlayAll}
        shuffleLabel={NEW_UI_PLD_LABELS.shuffle}
        onShuffle={handleShuffle}
      />
    </View>
  )

  // —— 列表尾状态行：与歌单池 / 排行榜同一件共通件 ——
  // loading：动画 +「正在载入下一批…」，翻页在途由 status + pageBusyRef 挡重入。
  // end：全量列完收「没有更多了」；末页成功与 loadNext 显式补 end 两个来源。
  // error（已载过首批）：可点重试行，点一下接着取同一页。
  // 转场期曲目被扣着不渲染，页脚一律按「正在载入」显示，
  // 否则本地歌单（缓存秒回、status 已是 end）会在空列表下先闪一句「没有更多了」
  const listStatus = opened ? status : 'loading'
  const listFooter = (
    <View>
      {listStatus === 'loading' && (
        <PagingStatus disabled loading text={NEW_UI_PLD_STATUS.loading} />
      )}
      {listStatus === 'end' &&
        (tracks.length
          ? <PagingEnd text={NEW_UI_PAGING_END_TEXT} />
          // 空单子文案按归属分（NEW_UI_PLD_EMPTY_BY_OWNER）
          : <EmptyTip variant="layer" text={NEW_UI_PLD_EMPTY_BY_OWNER[owner]} />)}
      {listStatus === 'error' &&
        (tracks.length
          ? (
            // 下一页失败：给点按重试，不靠反复触底
            <PagingStatus text={NEW_UI_PLD_STATUS.loadMoreError} onPress={loadNext} />
          )
          : (
            // 首屏失败重试：平台形态重取第 1 页，local 重读整单；统一入口防连点
            <Pressable onPress={handleRetryPress}>
              <EmptyTip variant="layer" text={isLocal ? NEW_UI_PLD_EMPTY.localError : NEW_UI_PLD_EMPTY.error} />
            </Pressable>
          ))}
    </View>
  )

  return (
    <View
      nativeID="newui.songlistDetail.content"
      style={[styles.root, { backgroundColor: theme.colors.bg }]}
    >
      {/* 氛围渐隐底纹（blur 不可用，降级为纯渐变）：压在内容之下、不吃触摸、下沿无硬边 */}
      <CoverWash
        colors={[bgC1, bgC2]}
        alpha={PL_LAYER.bgAlpha}
        heightRatio={PL_LAYER.bgHeightRatio}
      />
      <FixedWindowList
        style={styles.list}
        data={opened ? tracks : NO_TRACKS}
        rowHeight={PLD_ROW_HEIGHT}
        rowGap={PLD_ROW_GAP}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listContentStyle}
      />
      {/* 单曲操作面板：自建 / 本地形态额外传宿主单，面板据此插「从该单移出」一行 */}
      <MoreSheet
        visible={moreMusic != null}
        musicInfo={moreMusic}
        onClose={closeMore}
        bottomInset={bottom}
        hostListId={isHostLocalList ? listId : undefined}
        hostListName={isHostLocalList ? headerInfo.name || listName : undefined}
      />
      {/* 删单二次确认 */}
      <ConfirmSheet
        visible={deleteConfirmName != null}
        title={deleteConfirmName == null ? undefined : NEW_UI_PLD_DELETE_CONFIRM.title(deleteConfirmName)}
        body={NEW_UI_PLD_DELETE_CONFIRM.body}
        okLabel={NEW_UI_PLD_DELETE_CONFIRM.confirmText}
        onConfirm={() => {
          // 名字来自开层那一帧的闭包
          if (deleteConfirmName == null) return
          runDelete(deleteConfirmName)
        }}
        onClose={() => setDeleteConfirmName(null)}
        bottomInset={bottom}
      />
      {/* 提示胶囊：屏幕根层最后一子，压在浮层之上；本层 pop 后主屏宿主仍可收到同一条广播 */}
      <NewUiToastHost bottomInset={bottom} />
    </View>
  )
}

SonglistDetailScreen.displayName = 'NewUISonglistDetailScreen'

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** 列表压在氛围底纹之上（显式分层，不靠 JSX 声明顺序，避免底纹盖住头部） */
  list: {
    zIndex: Z_LAYER.layerContent,
  },
})
