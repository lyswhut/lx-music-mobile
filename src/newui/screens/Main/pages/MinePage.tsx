import { useCallback, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { LIST_IDS } from '@/config/constant'

// 直连 entry 而非 '@/newui/navigation' 桶口：避免 navigation/index → register → screens → 本文件的循环引用
import { pushNewUiLocalListDetail, pushNewUiOffline, pushNewUiSonglistDetail } from '@/newui/navigation/entry'

import {
  CardGrid,
  EmptyTip,
  FavCard,
  FootNote,
  MineHeader,
  pickArtPalette,
  PlCard,
  Section,
  SongRow,
  StatRow,
} from '@/newui/components'
import {
  getPlatformMeta,
  NEW_UI_BOARD_LIST_ID_PREFIX,
  NEW_UI_MINE_EDIT,
  NEW_UI_MINE_EMPTY,
  NEW_UI_MINE_FOOT_NOTE,
  NEW_UI_MINE_HEAD_SUB,
  NEW_UI_MINE_MORES,
  NEW_UI_MINE_PL_SUB,
  NEW_UI_MINE_STAT_LABELS,
  NEW_UI_MINE_TITLES,
  NEW_UI_MINE_TOAST,
  NEW_UI_OFFLINE,
  NEW_UI_PLAYLIST_ART_SEED,
  NEW_UI_PLAYLIST_EMPTY,
} from '@/newui/const'
import {
  useApiSupport,
  useGridItemWidth,
  hasPlatformHome,
  useLoveSongs,
  useMyPlaylistCovers,
  useMyPlaylists,
  type MyPlaylistItem,
  useNickName,
  useNowPlaying,
  useOfflineCache,
  useRecentPlays,
} from '@/newui/hooks'
import { PLATFORM_TINTS, SONG_ROW, type PlatformTintKey } from '@/newui/theme'
import { clearNewUiRecentPlays, playQueue, showNewUiToast, toSongDisplay } from '@/newui/utils'

import type { NewUiPageProps } from '../../types'

/** 最近播放列表最多列几首（原型 state.history 上限是 30 条，2026-11-05 产品改 10 条） */
const RECENT_LIMIT = 10

/**
 * 「我的歌单」卡副行（件 parts/mine/my-pl-mine.html U46，原型 plCardMine L1276 /
 * plCardCollected L1292）：收藏来的那份只说「收藏自 某平台 · N 首」（那份是平台只读的，
 * 卡面不与自建的比曲目数谁多）；自建那份才是「N 首 · M 首可播」。
 * 首数还没数出来时两种单子都先如实报「还在数有几首」。
 */
const plCardMeta = (list: MyPlaylistItem, collected: boolean): string => {
  if (list.count == null) return NEW_UI_MINE_PL_SUB.tallying
  return collected
    ? NEW_UI_MINE_PL_SUB.collected(getPlatformMeta(list.source as LX.OnlineSource).short, list.count)
    : NEW_UI_MINE_PL_SUB.mine(list.count, list.playable)
}

/**
 * 「我的」页（原型 #page-mine）容器：头部（.mine-head）+ 统计（.stat-row）+
 * 「我喜欢 / 已缓存」合一卡（.fav-card.fav-duo）+ 最近播放（.song-list.compact）+ 我的歌单（.pl-grid）。
 * 数据来源：收藏 = @/store/list 的「我喜欢」列表（useLoveSongs）；
 * 最近播放 = 新 UI 自记的收听历史（useRecentPlays → utils/recentPlay，
 * 播核心的 playedList 只是随机模式去重池、非随机恒空，不能当最近播放用）；
 * 本机缓存 = hooks/useOfflineCache（收藏 ∪ 最近播放 ∪ 各份歌单里已存在机器上的那些，只读汇总）；
 * 本地歌单 = store/list 的 allList（useMyPlaylists，与歌单页同源）；
 * 昵称 = 新 UI 自有存储（useNickName，旧 AppSetting 无用户信息键）。
 * 播放统一走 utils/play。合一卡两半各自开一屏（2026-10-27，件 parts/mine/fav-card U44 /
 * parts/mine/offline U86）：左半 = 打开内置「我喜欢」详情层（local 形态，kind 传 'fav'），
 * 右半 = 打开「已缓存」屏；原先那颗直接开播的圆钮随「两张卡合一」一起撤了，
 * 开播回到各自屏里的「播放全部」。
 * 「我的歌单」这一格列两种单子（件 parts/mine/my-pl-mine.html U46）：卡面按有没有平台坐标
 * 分叉（见 plCardMeta 与下面的 collected 分支）——收藏来的走平台真封面 +「收藏自 某平台 · N 首」，
 * 纯自建的走「第一首歌的封面（空单回落内置版式）」+「N 首 · M 首可播」。
 * 分叉只发生在渲染层，取数仍是 useMyPlaylists 那一份 allList（顺序、数据源、存储都不动）。
 */
export const MinePage = ({ componentId, onOpenNameSheet, onOpenMore, onOpenCreateListSheet }: NewUiPageProps) => {
  const { nickName, initial, avatarUri } = useNickName()
  const loveSongs = useLoveSongs()
  const recentPlays = useRecentPlays()
  const myLists = useMyPlaylists()
  // 走查现象 4（2026-10-27 复发修复）：收藏来的那份按平台坐标现查真封面。
  // 本地库里没存封面字段（types/list.d.ts:3-11），唯一真图源是平台明细接口的 info.img，
  // 取图走 hooks/useMyPlaylistCovers（限速 + 失败可重试 + 成功即入模块缓存）；
  // 纯自建与「存整榜」那份本就无图可取，如实退回内置版式。
  const listCovers = useMyPlaylistCovers(myLists)
  const nowPlaying = useNowPlaying()
  const assertApiSupport = useApiSupport()
  const cardWidth = useGridItemWidth()
  // 「已缓存」那一半与本机清单同源（U86）：清单由 hooks/useOfflineCache 只读汇总，
  // 这一页只取「几首 / 占用几 MB」两个数上卡，点进去才铺整列
  const offline = useOfflineCache(myLists)

  // .fav-card p：只留名词与数字——`${n} 首`；空收藏用原型原句（app.js L1286）
  const loveSub = useMemo(
    () => (loveSongs.length ? `${loveSongs.length} 首` : NEW_UI_MINE_EMPTY.love),
    [loveSongs.length],
  )

  // 右半副行（原型 app.js L1300）：`${n} 首 · ${mb} MB`；还在数就如实报过程句，空了整句换空态文案
  const offlineSub = useMemo(() => {
    if (offline.scanning) return NEW_UI_OFFLINE.scanning
    return offline.rows.length
      ? NEW_UI_OFFLINE.cardCount(offline.rows.length, offline.totalMb)
      : NEW_UI_OFFLINE.empty
  }, [offline.rows.length, offline.scanning, offline.totalMb])

  // 最近播放：新 UI 自记的收听历史（utils/recentPlay，切歌即记、本机留存、已按曲去重、只含在线曲）
  const recentSongs = useMemo(
    () => recentPlays.slice(0, RECENT_LIMIT),
    [recentPlays],
  )

  // 左半 = 打开「我喜欢」内置歌单详情（2026-10-14 用户条目）：与「我的歌单」卡同一入口、
  // 同一详情层形态。LOVE 是内置列表，详情层 isDeletableUserListId 兜住，自然不出现删除钮。
  // kind 传 'fav'（QA D04）：原型 PLD_CRUMB / PLD_FOOT / PLD_EMPTY 三张表都有 fav 一档
  // （面包屑「我喜欢」+ 专属页脚 + 专属空态），这张单子不该顶用「我的歌单」的文案
  const handleLoveCardPress = useCallback(() => {
    pushNewUiLocalListDetail(componentId, { id: LIST_IDS.LOVE, name: NEW_UI_MINE_TITLES.love }, 'mine', 'fav')
  }, [componentId])

  // 右半 = 整半开整屏（原型 #offlineCard 的 onclick = openOffline，app.js L1306）；
  // 卡上那颗直接开播的圆钮随「两张卡合一」一起撤了，开播只剩那一屏里的「播放全部」
  const handleOfflineCardPress = useCallback(() => {
    pushNewUiOffline(componentId)
  }, [componentId])

  const handleRecentPress = useCallback((index: number) => {
    void playQueue('played', recentSongs, index)
  }, [recentSongs])

  const handleRecentClear = useCallback(() => {
    clearNewUiRecentPlays()
    showNewUiToast(NEW_UI_MINE_TOAST.recentCleared)
  }, [])

  // 原型 #mineEdit（app.js L1591）：点「修改」弹 #nameSheet（昵称 + 头像两件事；浮层本体挂在 MainScreen 根层，9e）
  const handleEditNick = useCallback(() => {
    onOpenNameSheet?.()
  }, [onOpenNameSheet])

  // 与歌单页同款判定：平台导入的自建卡进新 UI 详情层（阶段 9c 换线）。
  // 「存整榜」进来的那份坐标带 board__ 前缀（榜单存榜口径，见 const/songlistDetail），
  // 按歌单坐标原样开进详情层会取不到歌——剥掉前缀、按 rank 形态开，榜才和歌单一样打得开
  const handleListPress = useCallback((list: MyPlaylistItem) => {
    if (list.source && list.sourceListId) {
      const isBoard = list.sourceListId.startsWith(NEW_UI_BOARD_LIST_ID_PREFIX)
      pushNewUiSonglistDetail(componentId, {
        id: isBoard
          ? list.sourceListId.slice(NEW_UI_BOARD_LIST_ID_PREFIX.length)
          : list.sourceListId,
        source: list.source,
        name: list.name,
        author: '',
      }, isBoard ? 'rank' : 'mine', 'mine')
      return
    }
    // 纯自建 / 本地：没有平台坐标，用同一详情页的「本地歌单」形态打开（listId 定位，
    // 2026-10-12 修复：与歌单页同款入口，不再是弹一句提示的假动作）
    pushNewUiLocalListDetail(componentId, { id: list.id, name: list.name }, 'mine')
  }, [componentId])

  return (
    <>
      <MineHeader
        initial={initial}
        avatarImageUri={avatarUri}
        name={nickName}
        sub={NEW_UI_MINE_HEAD_SUB}
        editLabel={NEW_UI_MINE_EDIT}
        onEditPress={handleEditNick}
      />

      <StatRow
        items={[
          { key: 'love', value: loveSongs.length, label: NEW_UI_MINE_STAT_LABELS.love },
          { key: 'lists', value: myLists.length, label: NEW_UI_MINE_STAT_LABELS.lists },
          { key: 'recent', value: recentSongs.length, label: NEW_UI_MINE_STAT_LABELS.recent },
        ]}
      />

      <FavCard
        loveTitle={NEW_UI_MINE_TITLES.love}
        loveSub={loveSub}
        offlineTitle={NEW_UI_MINE_TITLES.offline}
        offlineSub={offlineSub}
        onLovePress={handleLoveCardPress}
        onOfflinePress={handleOfflineCardPress}
      />

      <Section
        sub
        title={NEW_UI_MINE_TITLES.recent}
        more={recentSongs.length ? NEW_UI_MINE_MORES.recent : undefined}
        onMorePress={handleRecentClear}
      >
        {recentSongs.length
          ? (
            <View style={styles.songList}>
              {recentSongs.map((song, index) => {
                const playable = assertApiSupport(song.source)
                const display = toSongDisplay(song, playable)
                const active = nowPlaying.id === song.id
                return (
                  <SongRow
                    key={song.id}
                    rank={index + 1}
                    artSeed={display.artSeed}
                    artUri={display.artUri}
                    // 历史曲目没带封面图时，行内共通补图（2026-10-12 走查现象 1）
                    musicInfo={song}
                    title={display.title}
                    artist={display.artist}
                    album={display.album}
                    sourceLabel={display.sourceLabel}
                    sourceTint={display.sourceTint}
                    qualityLabel={display.qualityLabel}
                    durationText={display.durationText}
                    active={active}
                    playing={active && nowPlaying.playing}
                    dimmed={!playable}
                    compact
                    onPress={() => handleRecentPress(index)}
                    // 原型「最近播放」行带 ⋯（app.js L607，songRow 未传 noMenu）：9e 接线
                    onMore={onOpenMore == null ? undefined : () => { onOpenMore(song) }}
                  />
                )
              })}
            </View>
          )
          : <EmptyTip text={NEW_UI_MINE_EMPTY.recent} />}
      </Section>

      <Section
        sub
        title={NEW_UI_MINE_TITLES.lists}
        more={NEW_UI_MINE_MORES.lists}
        // 2026-10-13 bug-fix「我的」7a：这一角原是「去歌单页」切 Tab，换成「新建歌单」开输入浮层
        //（原型该角是 .section-more 文字 + chevron，index.html L232，视觉口径不变只换动作；
        // 浮层本体挂在 MainScreen 根层，建单成功后 mylistUpdated 事件让下面的卡即时出现）
        onMorePress={onOpenCreateListSheet}
      >
        {myLists.length
          ? (
            <CardGrid>
              {myLists.map(list => {
                // 内置版式种子（空单 / 平台收藏卡的兜底），同时决定自建卡圆点色
                const builtInSeed = `${NEW_UI_PLAYLIST_ART_SEED.mine}:${list.id}`
                // 件 parts/mine/my-pl-mine.html U46：这一格列的是两种单子，卡面按
                // 有没有平台坐标分叉（原型 listCover app.js L909-913 判 p.home）。
                // 只改渲染分支，数据源与存储一概不动。
                const collected = hasPlatformHome(list)
                return (
                  <PlCard
                    key={list.id}
                    width={cardWidth}
                    title={list.name}
                    // 自建单的封面位拿单子里第一首歌的专辑封面（原型 listCover 的第二条），
                    // 一首都没有（新建的空单）才回落到内置版式
                    artSeed={collected ? builtInSeed : (list.firstArtSeed ?? builtInSeed)}
                    // 收藏来的那份用平台那张真封面图（与【歌单】页推荐卡同一套写法：走 Art 的
                    // imageUri，图取不到时 Art 自己回落种子底）；自建那张有歌就用第一首的图，
                    // 平台侧本就无图可取，不画一张随机图冒充平台封面
                    artUri={collected ? listCovers[list.id] : list.firstArtUri}
                    // 播放角标只在收藏卡封面上（原型 plCardCollected L1295 追加 .play-badge，
                    // plCardMine 的内置版式封面不叠）
                    badge={collected}
                    meta={plCardMeta(list, collected)}
                    tint={
                      // 圆点色：收藏卡 = 平台 tint（原型 SOURCES[p.home].tint）；
                      // 自建卡 = 内置版式色板首色（原型 palette(p.seed)[0]）
                      collected
                        ? PLATFORM_TINTS[list.source as PlatformTintKey]
                        : pickArtPalette(builtInSeed)[0]
                    }
                    onPress={() => handleListPress(list)}
                  />
                )
              })}
            </CardGrid>
          )
          : <EmptyTip text={NEW_UI_PLAYLIST_EMPTY.mine} />}
      </Section>

      <FootNote text={NEW_UI_MINE_FOOT_NOTE} />
    </>
  )
}

const styles = StyleSheet.create({
  /** .song-list：竖向排布，行间距 2px */
  songList: {
    gap: SONG_ROW.listGap,
  },
})

MinePage.displayName = 'NewUIMinePage'
