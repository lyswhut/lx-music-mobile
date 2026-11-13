import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BackHandler,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { Navigation } from 'react-native-navigation'

import { LIST_IDS } from '@/config/constant'
import { clearListDetail, getListDetail, LIST_LOAD_LIMIT, setListDetail, setListDetailInfo } from '@/core/songlist'
// rank 形态数据分支：core/leaderboard 是另一套取数 API（leaderboard.getList，id={source}__{bangId}），
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
// local 形态取数与播放：getListMusics = core/list（内部自带缓存）；playList = core/player，
// 口径照抄旧「我的歌单」列表屏 @/screens/Home/Views/Mylist/MusicList/listAction.handlePlay
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
  FootNote,
  PagingEnd,
  PagingStatus,
  pickArtPalette,
  MinibarHost,
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
  NEW_UI_PLD_FOOT_BY_OWNER,
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
// 单曲操作面板与主屏同款（组件共通，挂在各屏根层；9e）
import { MoreSheet } from '@/newui/screens/Main/sheets'

export interface SonglistDetailScreenProps {
  componentId: string
  /** 歌单坐标与已知信息（形状即旧 pushSonglistDetailScreen 的 ListInfoItem）；平台形态必传，local 形态不传 */
  info?: ListInfoItem
  /** 形态（取数链路与按钮能力）；缺省 pl。平台导入的自建卡传 mine，纯本地歌单传 local，
   *  内置「我喜欢」传 fav（QA D04：取数走 local 那一套）。
   *  **2026-10-24 起 kind 不再决定文案**：面包屑 / 页脚 / 空态一律按「归属 owner」取（见屏内
   *  ownerOf 那段，原型 PLD_OWNER / playlistOwnerOf，app.js L805-841），同一张单子从哪进来都同名 */
  kind?: NewUiSonglistDetailKind
  /** local / fav 形态必传：本地歌单 id（store/list 的 allList 项，非平台坐标） */
  listId?: string
  /** local / fav 形态：本地歌单名（头部先行展示，与入口卡片一致） */
  listName?: string
  /** 来源 Tab（QA D-16）：从哪个主屏 Tab 推入本层，返回时先切回该 Tab 再 pop；
   * 非 Tab 页入口（如搜索层）不传，返回维持原样直接 pop 回上一层 */
  fromTab?: NewUiTabKey
}

/** 层内分页状态（沿用旧详情页 OnlineList 的四档语义） */
type LoadStatus = 'loading' | 'idle' | 'end' | 'error'

/** 头部展示信息：passProps 先行、平台返回后补齐（合并口径与旧 Header.setInfo 一致） */
interface DetailHeaderInfo {
  name: string
  desc: string
  author: string
  img?: string
  playCount: string
}

/**
 * 歌单详情层（原型 #plLayer / app.js openPlaylist L408-483，阶段 9c）。
 * 全屏右推屏（转场见 navigation/entry 的 pushNewUiSonglistDetail，复刻 .pl-layer translateX）。
 * 整层单滚动容器：顶排 + hero + 操作排进 FlatList 头部，与原型「层内整体滚动」一致。
 * **数据只读复用（按 kind 切两套旧 API，互不串台）**：
 * pl / mine —— 分页取歌 = @/core/songlist 的 getListDetail/setListDetail（含 LIMIT 分页缓存）；
 * 播放全部 / 单曲播放 = @/screens/SonglistDetail/listAction.handlePlay（先播已载队列、
 * 全量取回后升级临时队列，旧屏同款逻辑）；收藏 = 真 toggle（2026-10-12 走查）：
 * 未存走同文件 handleCollect 全量导入，已存走 @/core/list.removeUserList 移出，
 * 按下全程有 toast 反馈、不再撞旧 collect 的重复确认系统弹窗（旧文件一字未动）。
 * rank —— 榜单目录的 id 是 {source}__{bangId}，歌单 API 取不到歌，整套换走旧榜单视图同款：
 * 分页取歌 = @/core/leaderboard 的 getListDetail/setListDetail/setListDetailInfo/clearListDetail
 * （leaderboard 自己的分页 store，关闭时清场防与旧视图残留串台，口径照抄旧 MusicList）；
 * 播放 = @/screens/Home/Views/Leaderboard/listAction.handlePlay（listId 前缀 board__、
 * 全量升级走 core/leaderboard.getListDetailAll）；收藏 = 同文件 handleCollect——
 * **语义与旧榜单视图一致 = 把整张榜存进我的歌单**（旧 UI 本就有「收整榜」，见该文件 L34-57），
 * 单首收藏在歌曲行 ⋯（MoreSheet）；顶排心钮的文案与 toast 按此如实说明，不含糊。
 * 可播过滤沿用 utils/song + useApiSupport 口径。
 * **local —— 本地歌单形态（2026-10-12 修复「自建歌单点进去是假动作」）**：纯自建 / 试听 /
 * 收藏这类没有平台坐标的歌单，用**同一套布局**打开，只是取数换成 @/core/list 的
 * getListMusics（整单一次取全、自带缓存，无分页），订阅 app_event.myListMusicUpdate
 * 让「⋯ 面板加入 / 别处删歌」当场反映到本页；播放走 @/core/player/player 的
 * playList(listId, index)——队列就是这份歌单本身，本地文件也能播（旧 Mylist 音乐屏同款链路）。
 * 「存入我的歌单」心钮在此形态没有意义（它本来就在我的歌单里），2026-10-13 起这一位改放**删除本歌单**：
 * 只有 userList 里的单子给入口（保护口径见 utils/userList.isDeletableUserListId，照旧屏 MyList/ListMenu），
 * 系统「试听列表 / 我的收藏」这一位仍是同尺寸空槽，不出现点了报错的死按钮；
 * 按下先过 ConfirmSheet 二次确认（原型 #confirmSheet 同族共通件，QA D-09 起），确认后只走 @/core/list 的 removeUserList
 * 既有通道——落库 + mylistUpdated（「我的歌单」的卡由 useMyPlaylists 既有订阅自然少一张）
 * + 歌目记录一并清掉，成功 toast 后退出详情层回上一页；取消则一切不变。
 * 2026-10-15（拆件转正轮）：`.pl-top` / `.pl-actions` 两个原内联单元转正为独立组件
 * （PlTop / PlActions），渲染零变化、接线原样。
 * 2026-10-24（标题按归属）：面包屑 / 页脚 / 空态 / 右上钮不再按入口 kind 取文案，改按这份单子的
 * **归属 owner**（own / collected / platform / rank / fav，判据见屏内 ownerOf 与 const/songlistDetail
 * 末尾那段）。kind 继续只管取数链路与能力；入口推入逻辑（MinePage / PlaylistPage / 搜索层）一处未改。
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
  // 翻页请求在途（2026-10-15 触底补强配套）：同一拍里原生 onEndReached 与我们的补判
  // 可能先后落到 handleEndReached，status 还没翻新时靠这道闸挡住重复取同一页
  const pageBusyRef = useRef(false)
  // —— 翻页游标收回本屏自己手里（2026-10-28 todo 第 3 条「偶尔只铺一屏、下滑不再加载」）——
  // 原先本屏不记账，每次触底都去读那份**进程内全局共享、会被就地改写**的分页仓
  // （store/songlist 或 store/leaderboard 的 listDetailInfo）反推页码，还拿它跟入口坐标做身份比对。
  // 仓被首页失败那条兜底清空后（id='' / source='kw' / page=1 / maxPage=1），比对必然对不上，
  // loadNext 就静默 return——屏幕停在已到手的那一批，滑到底什么都不发生，且永不复活（只能杀进程）。
  // pageRef：本屏最后一次**成功**取到第几页（0 = 首屏还没落过页）；失败不推进，重试打的还是同一页。
  const pageRef = useRef(0)
  // maxPageRef：平台报的总页数快照（成功时写），判「还有没有下一页」只看本屏这一份，不吃仓里的值
  const maxPageRef = useRef(0)
  // reqSeqRef：请求代次令牌，写法照同项目先例 src/newui/hooks/usePlaylistPool.ts:105/:117。
  // 只有最新一代的 settle 才允许落 state / 推游标 / 复位闸门；迟到响应（连点重试留下的旧请求、
  // 30 秒超时后才落地的、effect 重跑作废旧批）整份作废，不会再出现「旧失败把新页码冲掉」的残留
  const reqSeqRef = useRef(0)
  // 收藏全量导入进行中标记（防连点重复抓全量，见 handleFavPress）
  const favBusyRef = useRef(false)
  // 删除已确认落库标记：置真后本页不再回读这张已经不存在的单子（见 loadLocalList / handleDeletePress）
  const deletedRef = useRef(false)
  // 删除确认弹窗 / 写入进行中标记：连点不叠第二个弹窗，也不重复发删除
  const deleteBusyRef = useRef(false)

  // 单曲操作面板目标（原型 pl-layer 行带 ⋯，app.js L469/880；9e 接线）
  const [moreMusic, setMoreMusic] = useState<LX.Music.MusicInfo | null>(null)
  // 删单二次确认的目标单名（QA D-09：系统 Alert 换回原型 #confirmSheet 同族的 ConfirmSheet）
  const [deleteConfirmName, setDeleteConfirmName] = useState<string | null>(null)

  // rank 形态开关：取数 / 分页 store / 播放收藏动作整套换走（见文件头注释），pl / mine 行为不变
  const isRank = kind === 'rank'
  // local 形态开关：取数换 @/core/list、播放换 playList、右上角心钮位换成删除钮（可删的单子才有）
  // QA D04：内置「我喜欢」(kind='fav') 的数据链路与 local 完全相同（按本地 listId 读整单、
  // 队列即这张单本身），所以一并走 local 这套取数；差异只在文案（面包屑 / 页脚 / 空态各按
  // PLD_* 的 fav 一档）与 hero 胶囊，见下面的 isFav 分支。删除钮不受影响——LOVE 是系统列表，
  // isDeletableUserListId 恒假，这一位仍是同尺寸空槽（原型 app.js L902-911 也是「整位留空但占位」，口径句在 L903）。
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
      // 榜单明细没有头部信息字段（store/leaderboard ListDetailInfo 无 info），hero 全程用 passProps
      // 超时护栏（QA D-08）：脚本/网络挂死时 Promise 可能永不 settle，到限走既有 error 分支给重试入口
      void withTimeout(getBoardListDetail(info.id, page), NEW_UI_PLD_LOAD_TIMEOUT_MS)
        .then(result => {
          if (seq !== reqSeqRef.current) return
          // 闸门复位排在卸载判定**之前**（第 3 条）：旧写法把复位写在 isUnmounted 之后，
          // 页面还活着而这一发是重挂载/重跑 effect 之前的迟到响应时，闸门被永久留在「在途」
          pageBusyRef.current = false
          if (isUnmountedRef.current) return
          // 与旧榜单视图 MusicList 同款：合并写回 leaderboard 分页 store 后取快照落 state
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
          // 首页失败且 store 里已有残页时清掉，避免下页错位（旧 MusicList 同款兜底）。
          // 本屏不再拿这份仓当翻页依据，清不清都不影响续取，故原样保留
          if (boardState.listDetailInfo.list.length && page == 1) clearBoardListDetail()
          setStatus('error')
        })
      return
    }
    // 超时护栏（QA D-08）：同上，平台歌单明细取数到限推到 error 分支
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
          // author 曾是五个字段里唯一没做末位兜底的：平台明细与 passProps 同时缺它时
          // undefined 会传进 PlaylistHero 的 sub.length 直接炸渲染（2026-10-12 清单第 6 条，
          // 搜索条目正是这种形状——mg search 无 desc 键、author 可为 undefined；目录条目恒为字符串）
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
        // 与旧 MusicList 同款兜底：首页失败且 store 里已有残页时清掉，避免下页错位
        if (songlistState.listDetailInfo.list.length && page == 1) clearListDetail()
        setStatus('error')
      })
  }, [info, isLocal, isRank])

  // —— local 形态取数：只读复用 @/core/list 的 getListMusics（自带缓存，重开秒回）；
  // 曲目增删（⋯ 面板加入 / 别处删歌 / 导入）走 app_event.myListMusicUpdate 就地刷新。
  // deletedRef 为真时不回读：单子已经删掉了，此时 myListMusicUpdate 也会带着这个 id 广播回来，
  // 再读一次会把空表写进 core 的曲目缓存（getListMusics 见 utils/listManage.ts L208-213），没有必要。
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
  // 与旧屏 loadList 一致，先重置对应 store 的详情态再拉取
  // （core/leaderboard 的 setListDetailInfo(id) 内部先 clearListDetail，签名与 songlist 版不同）
  useEffect(() => {
    if (isLocal || info == null) return
    isUnmountedRef.current = false
    // 本屏游标随进层归零：从第 1 页重取（原型 app.js L933-941「换单子从第一页重取」同一取向）。
    // 闸门也一并放开：上一代在途请求会被 loadPage(1) 的代次令牌作废，没人再替它复位
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
    // local 形态整单在手，无下一页可言（它的页脚恒为「没有更多了」或失败重读那一档，看得见）
    if (isLocal || info == null) return
    // 在途闸门（同 usePlaylistPool.ts:189）：这一条什么都不发，但此刻页脚正在转「正在载入下一批…」
    if (pageBusyRef.current) return
    // 页码由本屏自己记（第 3 条核心，不再从共享分页仓反推、也不再跟它比身份）：游标只在
    // 「本页成功落定」时推进，所以这里要么重取那一页还没到手的（首屏失败过一次 → 仍是 0 → 重打第 1 页），
    // 要么续下一页；不会越过第 1 页去要第 2 页（core 的页缓存按「上一页」推源页，跳页会整页漏歌）
    const page = pageRef.current + 1
    // 判到「没有下一页」显式收尾 end——让用户看到「没有更多了」那一行，而不是对着列表尾什么都不发生。
    // maxPageRef 只在成功时写，为 0 说明本屏还没落过页，不参与判定。
    // 注意：page 是「下一页要取的页码」，等于 maxPage 时仍需发请求（那是最后一页），
    // 只有 **超过** maxPage 才真正没有了。
    if (maxPageRef.current > 0 && maxPageRef.current < page) {
      setStatus('end')
      return
    }
    void loadPage(page)
  }, [info, isLocal, loadPage])

  /** 首屏失败的重试入口（页脚那行 EmptyTip）：闸门挡住「连点重试留下两条第 1 页请求并存」——
   * 这正是第 3 条死锁的第二条入口（后发的那条先成功、先发的那条 30 秒后才超时落地，把仓里的残页清空；
   * 现在代次令牌已让旧请求整份作废，这里再少发一发没必要的请求） */
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
    if (pageBusyRef.current) return
    if (status === 'loading' || status === 'end') return
    loadNext()
  }, [loadNext, status])

  // —— 触底补强（2026-10-15 同事清单：「有时滑到底没有自动触发获取更多，需要下滑再上滑」）——
  // 读 RN 0.73 VirtualizedList 源码核实的两个吞掉窗口：
  // ① onEndReached 只在滚动事件/布局事件里评估，快速甩动到底时末位 cell 还没补齐渲染
  //   （cellsAroundViewport.last 未到末位、pendingScrollUpdateCount>0 直接跳过），
  //   补齐渲染后不再有滚动事件，这一页就停住，直到用户下一次滚动；
  // ② 同一 contentLength 只发一次（按长度去重），失败/空页内容没长时，
  //   用户手指停在底部要「滚出触发线再滚回来」才重新发。
  // 修法：自己记滚动度量，在「内容尺寸变化」（含补齐渲染 / 状态行增减）与「滚动停下」
  // 两个时机按同一条 0.4×视口触发线补判一次。补判只在 status==='idle'（新一页刚到位、
  // 用户仍贴底）时自动续取——失败态不自动撞网（保持原「点重试」入口），连发由 pageBusyRef 挡。
  const PLD_END_REACHED_THRESHOLD = 0.4
  const scrollMetricsRef = useRef({ offset: 0, visible: 0, content: 0 })

  const maybeContinuePaging = useCallback(() => {
    if (status !== 'idle') return
    const { offset, visible, content } = scrollMetricsRef.current
    if (visible <= 0 || content <= 0) return
    const maxOffset = Math.max(0, content - visible)
    const remaining = content - visible - Math.min(offset, maxOffset)
    if (remaining > PLD_END_REACHED_THRESHOLD * visible) return
    handleEndReached()
  }, [handleEndReached, status])

  const handleListContentSizeChange = useCallback((_width: number, height: number) => {
    scrollMetricsRef.current.content = height
    maybeContinuePaging()
  }, [maybeContinuePaging])

  const handleListLayout = useCallback((e: LayoutChangeEvent) => {
    scrollMetricsRef.current.visible = e.nativeEvent.layout.height
    maybeContinuePaging()
  }, [maybeContinuePaging])

  /** 滚动停手（拖拽结束 / 惯性结束）：拿最新三段度量补一次触底判定 */
  const handleScrollSettle = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    scrollMetricsRef.current = {
      offset: contentOffset.y,
      visible: layoutMeasurement.height,
      content: contentSize.height,
    }
    maybeContinuePaging()
  }, [maybeContinuePaging])

  /** 统一返回（QA D-16 落位不稳）：先向存活的主屏投递来源 Tab、再 pop 本层——
   * 与搜索层 handleGotoSetting 同一条 utils/tabJump 通道，不新造路由。
   * 没有来源 Tab（搜索层等入口）就什么都不投，直接 pop，行为与旧一致。 */
  const goBack = useCallback(() => {
    if (fromTab != null) requestNewUiTab(fromTab)
    void Navigation.pop(componentId)
  }, [componentId, fromTab])

  /** 硬件返回键显式接管（QA D-16：交给 RNN 默认 pop 在真机上落位不稳，一次退桌面、
   * 一次落首页）。写法照共通件 Sheet 家族的挂载期 BackHandler：本页存续期间始终注册，
   * 消费后走与头部返回钮同一条 goBack。浮层（MoreSheet / ConfirmSheet）可见时注册的
   * 监听更晚、RN 按后注册先消费——开着浮层时先关浮层，不会连带退页（第 12 轮删除确认链不受影响）。 */
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack()
      return true
    })
    return () => { subscription.remove() }
  }, [goBack])

  const closeMore = useCallback(() => setMoreMusic(null), [])

  // —— 可播口径（原型 openPlaylist：playable = tracks.filter(supports)）——
  const playable = useMemo(
    () => tracks.filter(song => assertApiSupport(song.source)),
    [assertApiSupport, tracks],
  )
  // 分母优先取平台报的总数（分页下已载部分不足以做分母），拿不到才用已载数（local 恒已载全量）
  const totalCount = total > 0 ? total : tracks.length
  // QA 2026-10-14 详情页 D-05：首批曲目还在路上时 tracks 为空，此时的任何计数都是虚报
  // （「0/232 首可播」「0 首」「播放全部 0 首」）。原型 app.js L901-905 同款取向：
  // 一首都没定位到时不报计数，只回显来自哪个平台；这里按同一口径挂 pending 态。
  const tracksPending = tracks.length === 0 && status === 'loading'
  const metaTag = isRank && info != null
    ? getPlatformMeta(info.source).label
    : tracksPending
      ? (info?.source != null ? getPlatformMeta(info.source).label : NEW_UI_PLD_TAG_PENDING)
      : isFav && tracks.length === 0
        // 空收藏报「0/0 首可播」是废话，原型 app.js L944-947 同一取向，改成如实一句
        ? NEW_UI_PLD_TAG_EMPTY_FAV
        : newUiPlayableTag(playable.length, totalCount)
  const metaParts = useMemo(() => {
    const parts: string[] = []
    // rank 没有总数头字段、local 整单在手且无平台播放数，都如实显示已载/全量首数；
    // 但首批未在手时不报数（D-05，同上口径）
    if ((isRank || isLocal) && !tracksPending) parts.push(`${tracks.length} 首`)
    if (headerInfo.playCount) parts.push(`${headerInfo.playCount}播放`)
    return parts
  }, [headerInfo.playCount, isLocal, isRank, tracks.length, tracksPending])

  // 封面种子：local 与入口「我的歌单」卡片同一颗种子（mypl:listId），页内页外底图一致；
  // 本地歌单没有平台封面图时（绝大多数），hero 与氛围底纹都如实回落在这颗种子的程序化纹理上
  const artSeed = isLocal
    ? `${NEW_UI_PLAYLIST_ART_SEED.mine}:${listId}`
    : `${info?.source ?? ''}__${info?.id ?? ''}`
  const [bgC1, bgC2] = useMemo(() => pickArtPalette(artSeed), [artSeed])

  /**
   * hero 封面（2026-10-27，与入口卡面同一口径 listCover app.js L909-913）：
   * 只有「本地歌单」形态跟着第一首走——从「我的歌单」点进来时卡上看到的就是第一首的封面，
   * 进层后头图得是同一张；空单回落内置版式种子，没图则 Art 自己画种子底。
   * **「我喜欢」与平台歌单 / 榜单不动**：fav 仍走内置版式（它的头图不是某一首的专辑图），
   * 平台 / 榜单仍用平台给的 `headerInfo.img`（件 parts/songlist-detail/pl-hero U68）。
   * 氛围底纹 .pl-bg 原型对所有形态都用 palette(seed)（openPlaylist 给底纹那一步），仍用上面的 artSeed。
   */
  const localHero = kind === 'local' && tracks.length > 0
    ? toSongDisplay(tracks[0], true)
    : null
  const heroArtSeed = localHero?.artSeed ?? artSeed
  const heroArtUri = kind === 'local' ? localHero?.artUri : headerInfo.img

  // rank 形态头图（原型 app.js 的 chartArt(plNow) 分支）：方块换成该榜那张真插画——ChartArt 内部按榜名
  // 查 rankCoverKey，与榜单页 RankCard 同一颗查表，点进详情认的还是同一张脸。
  // 非 rank 形态走原 Art 封面路径（真实封面图优先、无图程序化底），零变化。
  // 注意：氛围底纹 .pl-bg 原型对所有形态都是 palette(seed)，本轮不动，仍用上面的 artSeed。

  // 收藏态 = 已进「我的歌单」（本项目无原型 favPl 独立收藏概念，用本地歌单存在性如实映射）。
  // rank 形态按旧榜单视图的存榜坐标匹配：sourceListId = `board__${榜单 id}`
  // （@/screens/Home/Views/Leaderboard/listAction 的 getListId 口径，直接比 info.id 永远对不上）。
  // local 形态没有心钮（见头部渲染处），此判定恒不命中。
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
   * —— 归属 owner（原型 PLD_OWNER / playlistOwnerOf，app.js L805-841；2026-10-24 落地）——
   * 这一屏「顶上叫什么、页脚怎么说、空单子怎么劝、右上那颗是删是收」一律看它，不看入口 kind：
   * kind 继续只管取数链路（songlist / leaderboard / core.list 三套）与按钮能力。
   *   fav       —— 内置「我喜欢」：固定 listId（LOVE），不靠入口自称；
   *   own       —— 纯自建：没有平台坐标的本机单子（kind='local' 那一支的数据链路）；
   *   rank      —— 整榜（含从「我的歌单」点进来的「存整榜」那份：入口已剥掉 board__ 前缀，
   *                取数走 core/leaderboard，这一支本就只能由 kind='rank' 表达）；
   *   collected —— 平台单且已在本机 userList 里（source + sourceListId 命中；
   *                从搜索层 / 歌单页池子 / 我的歌单哪一处再点进同一张已收藏单，都算出这一档）；
   *   platform  —— 平台单还没收。
   * 收藏关系命中用的就是上面 collectedList 那一份（myLists 来自 @/store/list 的 allList，
   * 订阅 mylistUpdated），所以在页内点收藏后标题会当场从「歌单」变成「收藏歌单 · 平台名」。
   * 判据顺序照原型：fav 先于 own（LOVE 虽在 userList 名单里，但它不是自建单）。
   */
  const owner: NewUiPlaylistOwner = listId === LIST_IDS.LOVE || isFav
    ? 'fav'
    : isLocal
      ? 'own'
      : isRank
        ? 'rank'
        : collectedList != null ? 'collected' : 'platform'

  // —— 动作（原型 L452-470：播放全部 / 随机 / 点行；均走旧屏同款 handlePlay 队列升级）——
  // pl / mine = SonglistDetail/listAction（core/songlist 全量升级）；
  // rank = Leaderboard/listAction（core/leaderboard 全量升级，旧榜单视图同款「整榜先播已载、全量升级临时队列」）；
  // local = core/player 的 playList(listId, 全列表序号)——队列即这份歌单本身（旧 Mylist 音乐屏同款 handlePlay，
  // 本地文件也在队列内可播）；index 与另两形态同义 = 「可播子集」里的序号，这里换算回它在整单里的位置。
  // playable 的平台三形态来源恒为在线曲目（songlist / leaderboard 分页 store），断言只是补 TS 窄化
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
    // 原型 shuf.onclick：play + openLayer(player())，成功播放即上滑打开播放页
    void pushNewUiPlayer(componentId)
  }, [componentId, playAt, playable])

  const handleSongPress = useCallback((index: number) => {
    const song = tracks[index]
    if (song == null) return
    if (!assertApiSupport(song.source)) {
      showNewUiToast(NEW_UI_PLD_TOAST.unplayable(getPlatformMeta(song.source).label))
      return
    }
    // 队列给可播子集（原型 songRow(s, i, playable)），行号换算成其在队列里的位置（必在其中）
    playAt(playable.indexOf(song))
  }, [assertApiSupport, playAt, playable, tracks])

  const handleFavPress = useCallback(() => {
    // local 形态没有心钮（本单已在「我的歌单」里，存单动作没有意义），此处只为类型收口再加一道闸
    if (isLocal || info == null) return
    // 真 toggle（2026-10-12 走查：用户明确不接受「只能收不能撤」的近似语义）：
    // 已存 → 直接走 @/core/list 的 removeUserList 移出（旧「我的」页删榜同一函数，不另写存储）；
    // 未存 → 按 kind 走旧 listAction 的整榜 / 整单全量导入。
    // 由此不再可能撞进旧 collect 的「重复收藏确认」系统 Alert——该弹窗在新 UI 屏内
    // 就是上一轮「点了没动静」的嫌疑路径（旧 listAction 本身一字未动，只是被我们前置拦住）。
    if (collectedList) {
      void removeUserList([collectedList.id])
        .then(() => { showNewUiToast(NEW_UI_PLD_TOAST.favRemoved) })
        .catch(() => { showNewUiToast(NEW_UI_PLD_TOAST.favFailed) })
      return
    }
    // 导入进行中的连点拦截：全量取歌动辄几十秒，期间 collected 还没翻 true，
    // 不设闸会把同一份榜再全量抓一遍（落库侧 userListCreate 按 id 静默去重，不至于收出两份榜）
    if (favBusyRef.current) return
    favBusyRef.current = true
    // 全量导入要逐页取歌（一张 600 首的榜可能要几十秒），按下先给可感知反馈，
    // 成功 toast（「收藏成功」）由旧 listAction 内部发，失败兜底报错（void 吞掉的 rejection 也曾读成「没反应」）
    showNewUiToast(isRank ? NEW_UI_PLD_TOAST.boardSaving : NEW_UI_PLD_TOAST.favSaving, 'long')
    void (isRank
      ? handleBoardCollect(info.id, headerInfo.name || info.name, info.source)
      : handleCollect(info.id, info.source, headerInfo.name || info.name)
    )
      .catch(() => { showNewUiToast(NEW_UI_PLD_TOAST.favFailed) })
      .finally(() => { favBusyRef.current = false })
  }, [collectedList, headerInfo.name, info, isLocal, isRank])

  // —— 本地歌单删除（2026-10-13 清单「我的」第 2 条后半）——
  // 可删判定只按 id（口径见 utils/userList.isDeletableUserListId：照抄旧 MyList/ListMenu L77-87，
  // 试听 / 我的收藏这类系统列表不在 userList 里，删不掉也不该出现入口）。
  // 2026-10-24 起这一格改由归属判：只有 own（纯自建）才谈得上「删这份单子」——
  // 收藏来的平台单删不掉平台侧那张，只能「移出收藏」（右上那颗心）。
  const canDeleteList = owner === 'own' && isDeletableUserListId(listId)

  // —— 单曲「⋯」面板的宿主单口径（件 U76，需求 2）——
  // 原型 openMore L1559 判的是 `plNow.kind === 'local'` 且能在 MY_PLAYLISTS 里命中这张单，
  // RN 侧这两个条件本屏就拿得到：kind==='local' 只由纯自建 / 本地单子推入（平台导入的走 'mine'/'rank'，
  // 内置「我喜欢」走 'fav'），isDeletableUserListId 与旧 MyList/ListMenu 同口径认「在 userList 里」。
  // 命中就把这张单的 id + 名字传给面板，面板据此插一行「从「该单」移出」；其余形态一概不传。
  const isHostLocalList = kind === 'local' && isDeletableUserListId(listId)

  const handleDeletePress = useCallback(() => {
    if (!canDeleteList || deleteBusyRef.current) return
    // 二次确认走共通件 ConfirmSheet（原型 #confirmSheet，app.js L1010-1014 askDeleteList；
    // QA 2026-10-14 D-09：此前借旧屏的 confirmDialog 系统 Alert，载体降级，本轮换回浮层家族）。
    // 只落确认态；用户取消 → 关层即完，单子、曲目、页面一概不动
    setDeleteConfirmName(headerInfo.name || listName)
  }, [canDeleteList, headerInfo.name, listName])

  /** 确认浮层右键后的真删除（名字由确认态在开层那一帧的闭包带入，与点按目标一致） */
  const runDelete = useCallback((name: string) => {
    deleteBusyRef.current = true
    // 删除只走既有通道 @/core/list.removeUserList（详情页取消收藏上一批已在用同一个函数）：
    // event/listEvent.ts L117-125 一条链做完「持久化 + setUserList（→ state_event.mylistUpdated，
    // useMyPlaylists 既有订阅自然少一张卡）+ removeListMusics 清歌目记录 + myListMusicUpdate +
    // checkListExist（若正激活这张单则回落试听列表）」，本页不另写任何存储或状态清理
    deletedRef.current = true
    void removeUserList([listId])
      .then(() => {
        if (isUnmountedRef.current) return
        showNewUiToast(NEW_UI_PLD_TOAST.listDeleted(name))
        // 单子已经不存在了，留在一具空壳页上没有意义：删完退出详情层——
        // 走统一 goBack（QA D-16：有来源 Tab 时落回那张卡所在的 Tab，而非随机首页）
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
  const renderItem = useCallback(({ item, index }: { item: LX.Music.MusicInfo; index: number }) => {
    const playableSong = assertApiSupport(item.source)
    const active = nowPlaying.id === item.id
    return (
      <SongRow
        rank={index + 1}
        {...toSongDisplay(item, playableSong)}
        // 明细接口没带逐曲封面时（酷我），行内共通补图（2026-10-12 走查现象 1）
        musicInfo={item}
        active={active}
        playing={active && nowPlaying.playing}
        dimmed={!playableSong}
        onPress={() => { handleSongPress(index) }}
        // 原型 pl-layer 歌曲行右侧 ⋯（songRow L307-312，此列表未传 noMenu）
        onMore={() => setMoreMusic(item)}
        // 行距样式取模块级静态对象（2026-10-15 性能轮）：原先每行每次渲染都现造一个
        // `{ marginTop }` 字面量，SongRow 的 memo 因样式引用变化而失效，等于整列白重渲染
        style={index > 0 ? styles.rowGap : undefined}
      />
    )
  }, [assertApiSupport, handleSongPress, nowPlaying.id, nowPlaying.playing])

  const keyExtractor = useCallback((item: LX.Music.MusicInfo) => item.id, [])

  // 内容留白样式缓存（2026-10-15 性能轮）：原先是渲染期现造的对象字面量，本页每次重渲染
  // （切曲、翻页、开关浮层都会）都让 VirtualizedList 把 contentContainer 的样式当新值下发，
  // 触发整块内容区重新布局；安全区/内距都是稳定值，缓存后只在 top/bottom 变化时重建。
  // 这一屏是「整层滚」（原型 `.wide #plLayer` 注释：层自己就是轴，头部三排在 ListHeader 里跟着滚，
  // 没有钉住段），所以档位只落在这一个 contentContainer 上：
  // `.wide #plLayer{padding:36px max(16px,calc((100% - 620px)/2)) 34px}`（styles.css:1335）
  // —— 顶内衬回正到这一档 32 状态栏之上的 4、左右吃 620 居中轴，底那一位 34 原型没动；
  // compact 两个 `??` 都回竖屏基线（PL_LAYER.paddingTopReserve / paddingX），逐值零变化。
  const listContentStyle = useMemo(() => ({
    paddingTop: top + (wide?.statusReserve ?? PL_LAYER.paddingTopReserve),
    paddingHorizontal: layerPaddingX ?? PL_LAYER.paddingX,
    paddingBottom: PL_LAYER.paddingBottom + bottom,
  }), [top, bottom, wide, layerPaddingX])

  // 头部三排（顶排 / hero / 操作排）随列表整体滚（原型 .pl-layer 单滚动容器）
  const listHeader = (
    <View>
      {/* .pl-top：grid 34 / 1fr / 34，返回钮 = chevron 转 180°，图标底 .08 取 strong */}
      <PlTop
        // 面包屑按归属取（原型 plCrumbOf）：收藏单补平台全名，自建 / 榜单 / 我喜欢各自一句
        crumbText={newUiPlCrumb(owner, info?.source)}
        backLabel={NEW_UI_PLD_LABELS.back}
        onBack={goBack}
        // 右上那一格（#plFavBtn）按归属分（原型 openPlaylist 的 owner 分支，app.js L902-922）：
        // own —— 可删的单子给「删除本歌单」（trash + err 色 + 按下必过二次确认），系统列表留空槽；
        // fav —— 存自己没意义、也删不掉，同尺寸空槽（原型 visibility:hidden 占位）；
        // collected / platform / rank —— 收藏心钮（已收 → 实心 + 按下移出；榜单收起整榜，
        // 语义全靠 accessibilityLabel 那一句）
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

      {/* .pl-actions：ghost 占 flex:1 + 42 方形随机钮（底色走 IconButton 缺省 glass .07） */}
      <PlActions
        // 首批未在手时不跟虚报的「0 首」（D-05）；取回后如实标可播数
        playAllLabel={`${NEW_UI_PLD_LABELS.playAll}${tracksPending ? '' : ` ${playable.length} 首`}`}
        onPlayAll={handlePlayAll}
        shuffleLabel={NEW_UI_PLD_LABELS.shuffle}
        onShuffle={handleShuffle}
      />
    </View>
  )

  // —— 列表尾状态行（原型 renderPlTracks L998-1006）：三档形态与歌单池/排行榜同一件共通件 ——
  // loading：RunningDots 三点接力动画 +「正在载入下一批…」（button.disabled，不可点；
  // 2026-10-15 起静态转圈换动画标识，请求发出到数据回来的整个窗口持续跳动）；handleEndReached
  // 已按 status + pageBusyRef 挡重入，翻页在途不会再发下一页。
  // end：全量列完收一行「没有更多了」再落页脚说明（pl-end + #plFoot 原型两物同在，一屏列完的
  // 短单子也如实收尾，不留「对着空白猜还在不在加载」的列表尾）。这一档现在有两个来源：
  // 取回末页时成功回调直接写 end；本屏判到「没有下一页」时 loadNext 也显式补一次 end（2026-10-28 第 3 条）。
  // error（已载过首批）：裸文字可点的重试行（brand + 700），点一下接着取同一页。
  const listFooter = (
    <View>
      {status === 'loading' && (
        <PagingStatus disabled loading text={NEW_UI_PLD_STATUS.loading} />
      )}
      {status === 'end' &&
        (tracks.length
          ? (
            <>
              <PagingEnd text={NEW_UI_PAGING_END_TEXT} />
              {/* 页脚按归属取（原型 PLD_FOOT）：只有 own 才说「只存在这台设备上」，
                  收藏 / 平台单用歌单那一档，榜单与「我喜欢」各自保留——不再出现
                  「收藏歌单 + 只存在这台设备上」这种自相矛盾 */}
              <FootNote text={NEW_UI_PLD_FOOT_BY_OWNER[owner]} />
            </>
          )
          // 空单子按归属分（原型 renderPlTracks 空分支，app.js L1053-1058）：
          // 内置「我喜欢」说清去哪收；自建单被搬空，引导去「⋯」里加歌；
          // 收藏 / 平台单 / 榜单是平台侧给的就空，如实请换一份
          : <EmptyTip variant="layer" text={NEW_UI_PLD_EMPTY_BY_OWNER[owner]} />)}
      {status === 'error' &&
        (tracks.length
          ? (
            // 下一页失败：不靠滚动触底反复撞墙（触底也可能撞上来），给点按重试
            <PagingStatus text={NEW_UI_PLD_STATUS.loadMoreError} onPress={loadNext} />
          )
          : (
            // 首屏失败重试：平台形态重取第 1 页，local 形态重读本地整单（loadPage 不吃 local）；
            // 走统一入口，连点不再留下两条并存的首页请求（见 handleRetryPress）
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
      {/* .pl-bg：封面种子渐变铺顶 56%（blur(64)+saturate(150) 不可用，降级为纵向渐隐的纯渐变）。
          共通件 CoverWash 负责两件事：显式压在内容之下（不吃触摸、不糊在头部上）+ 下沿无硬边。 */}
      <CoverWash
        colors={[bgC1, bgC2]}
        alpha={PL_LAYER.bgAlpha}
        heightRatio={PL_LAYER.bgHeightRatio}
      />
      <FlatList
        // 原型 .pl-layer > * { z-index: 1 }：与 CoverWash 的 z-index:0 成对，
        // 头部那一排按钮（返回 / 收藏）不再被底纹层挡下点击
        style={styles.list}
        data={tracks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        onEndReached={handleEndReached}
        // 触发线与补判口径同一颗常量（见 maybeContinuePaging），2026-10-15 触底补强
        onEndReachedThreshold={PLD_END_REACHED_THRESHOLD}
        onContentSizeChange={handleListContentSizeChange}
        onLayout={handleListLayout}
        onScrollEndDrag={handleScrollSettle}
        onMomentumScrollEnd={handleScrollSettle}
        // LIST_LOAD_LIMIT（core/songlist / core/leaderboard 同为 30）= 平台单 / 榜单单一批的最大条数。
        // 与 minibar 触发重渲染后虚拟化窗口才"展开"那一类视觉错觉（2026-10-29 互逆复现路径）对症。
        // local 形态整单在手、条数也不会比平台一批大，同一值通用。
        initialNumToRender={LIST_LOAD_LIMIT}
        maxToRenderPerBatch={14}
        windowSize={9}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listContentStyle}
      />
      {/* 常驻迷你播放条：本层默认磁吸圆点（原型 miniPageSnapped：不在首页就是圆点）。
          排在单曲面板与提示胶囊之前——圆点压在推入层内容之上，弹层（sheet 80）与胶囊（90）仍盖过它 */}
      <MinibarHost componentId={componentId} bottomInset={bottom} defaultSnapped />
      {/* 单曲操作面板（原型 #moreSheet）：与主屏同一组件，本屏行内 ⋯ 的目标曲在这里。
          自建 / 本地形态（isHostLocalList）额外把宿主单报给它，面板据此插「从「该单」移出」一行
          （件 U76 需求 2）；平台歌单 / 榜单 / 内置「我喜欢」不传，那一行就不出现 */}
      <MoreSheet
        visible={moreMusic != null}
        musicInfo={moreMusic}
        onClose={closeMore}
        bottomInset={bottom}
        hostListId={isHostLocalList ? listId : undefined}
        hostListName={isHostLocalList ? headerInfo.name || listName : undefined}
      />
      {/* 删单二次确认（原型 #confirmSheet，app.js L1010-1014；QA D-09 换掉系统 Alert） */}
      <ConfirmSheet
        visible={deleteConfirmName != null}
        title={deleteConfirmName == null ? undefined : NEW_UI_PLD_DELETE_CONFIRM.title(deleteConfirmName)}
        body={NEW_UI_PLD_DELETE_CONFIRM.body}
        okLabel={NEW_UI_PLD_DELETE_CONFIRM.confirmText}
        onConfirm={() => {
          // 开层那一帧的闭包带上确认目标的名字；收层已由 ConfirmSheet 内部先走 onClose
          if (deleteConfirmName == null) return
          runDelete(deleteConfirmName)
        }}
        onClose={() => setDeleteConfirmName(null)}
        bottomInset={bottom}
      />
      {/* 提示胶囊（QA D-09）：屏幕根层最后一子——原型 .toast z-index:90 压过浮层。
          本层 pop 后仍挂载的主屏宿主同收一条广播，「删完退页」类提示在落点页继续可见 */}
      <NewUiToastHost bottomInset={bottom} />
    </View>
  )
}

SonglistDetailScreen.displayName = 'NewUISonglistDetailScreen'

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /**
   * 列表本体压在氛围底纹之上（原型 .pl-layer > * z-index:1，底纹 0）。
   * 显式标一层，不靠 JSX 声明顺序 —— 2026-10-12 走查现象 1/2 的「上半部蒙板 + 心钮点不动」
   * 就是这层顺序在设备上失真、底纹盖住头部造成的。
   */
  list: {
    zIndex: Z_LAYER.layerContent,
  },
  /** .song-list gap:2 的行距（模块级静态，供 renderItem 复用同一引用） */
  rowGap: {
    marginTop: SONG_ROW.listGap,
  },
})
