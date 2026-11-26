import { useCallback, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { LIST_IDS } from '@/config/constant'

// 直连 entry 而非 '@/newui/navigation' 桶口：避免 navigation/index → register → screens → 本文件的循环引用
import { pushNewUiLocalListDetail, pushNewUiOffline, pushNewUiSonglistDetail } from '@/newui/navigation/entry'

import {
  CardGrid,
  EmptyTip,
  FavCard,
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

/** 最近播放列表最多列几首 */
const RECENT_LIMIT = 10

/**
 * 「我的歌单」卡副行：收藏来的说「收藏自 某平台 · N 首」，自建的才是「N 首 · M 首可播」；
 * 首数未出来时都先报「还在数有几首」。
 */
const plCardMeta = (list: MyPlaylistItem, collected: boolean): string => {
  if (list.count == null) return NEW_UI_MINE_PL_SUB.tallying
  return collected
    ? NEW_UI_MINE_PL_SUB.collected(getPlatformMeta(list.source as LX.OnlineSource).short, list.count)
    : NEW_UI_MINE_PL_SUB.mine(list.count, list.playable)
}

/**
 * 「我的」页容器：头部 + 统计 + 「我喜欢 / 已缓存」合一卡 + 我的歌单 + 最近播放。
 * 收藏 = store/list 的「我喜欢」；最近播放 = 新 UI 自记历史（utils/recentPlay，非播核心 playedList）；
 * 本机缓存由 hooks/useOfflineCache 只读汇总；本地歌单 = store/list 的 allList；播放统一走 utils/play。
 */
export const MinePage = ({ componentId, onOpenNameSheet, onOpenMore, onOpenCreateListSheet }: NewUiPageProps) => {
  const { nickName, initial, avatarUri } = useNickName()
  const loveSongs = useLoveSongs()
  const recentPlays = useRecentPlays()
  const myLists = useMyPlaylists()
  // 收藏来的歌单按平台坐标现查真封面（本地库不存封面图），走 hooks/useMyPlaylistCovers；
  // 自建 / 存整榜无图可取，退回内置版式
  const listCovers = useMyPlaylistCovers(myLists)
  const nowPlaying = useNowPlaying()
  const assertApiSupport = useApiSupport()
  const cardWidth = useGridItemWidth()
  // 「已缓存」这一半由 hooks/useOfflineCache 只读汇总，本页只取条数与占用上卡
  const offline = useOfflineCache(myLists)

  // 收藏副行：只留「N 首」；空收藏用空态文案
  const loveSub = useMemo(
    () => (loveSongs.length ? `${loveSongs.length} 首` : NEW_UI_MINE_EMPTY.love),
    [loveSongs.length],
  )

  // 已缓存副行：「N 首 · M MB」；还在数报过程句，空了换空态文案
  const offlineSub = useMemo(() => {
    if (offline.scanning) return NEW_UI_OFFLINE.scanning
    return offline.rows.length
      ? NEW_UI_OFFLINE.cardCount(offline.rows.length, offline.totalMb)
      : NEW_UI_OFFLINE.empty
  }, [offline.rows.length, offline.scanning, offline.totalMb])

  // 最近播放：新 UI 自记历史（切歌即记、按曲去重、只含在线曲）
  const recentSongs = useMemo(
    () => recentPlays.slice(0, RECENT_LIMIT),
    [recentPlays],
  )

  // 左半：打开「我喜欢」内置歌单详情，kind 传 'fav' 走专属面包屑 / 页脚 / 空态；
  // LOVE 是内置列表，详情层不会出现删除钮
  const handleLoveCardPress = useCallback(() => {
    pushNewUiLocalListDetail(componentId, { id: LIST_IDS.LOVE, name: NEW_UI_MINE_TITLES.love }, 'mine', 'fav')
  }, [componentId])

  // 右半：整屏打开「已缓存」，开播在那一屏的「播放全部」
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

  // 点「修改」弹出昵称 + 头像浮层（本体挂在 MainScreen 根层）
  const handleEditNick = useCallback(() => {
    onOpenNameSheet?.()
  }, [onOpenNameSheet])

  // 平台导入的歌单进详情层；「存整榜」的坐标带 board__ 前缀，
  // 需剥掉前缀并按 rank 形态打开，否则取不到歌
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
    // 纯自建 / 本地：无平台坐标，用同一详情页的「本地歌单」形态按 listId 打开
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
        title={NEW_UI_MINE_TITLES.lists}
        more={NEW_UI_MINE_MORES.lists}
        // 右上角：开「新建歌单」输入浮层（本体挂在 MainScreen 根层，建单后列表自动刷新）
        onMorePress={onOpenCreateListSheet}
      >
        {myLists.length
          ? (
            <CardGrid>
              {myLists.map(list => {
                // 内置版式种子（空单 / 平台收藏卡的兜底），同时决定自建卡圆点色
                const builtInSeed = `${NEW_UI_PLAYLIST_ART_SEED.mine}:${list.id}`
                // 卡面按有无平台坐标分叉（收藏 / 自建两种单子），只改渲染分支
                const collected = hasPlatformHome(list)
                return (
                  <PlCard
                    key={list.id}
                    width={cardWidth}
                    title={list.name}
                    // 自建单的封面取第一首歌的专辑图，没有歌（空单）才回落内置版式
                    artSeed={collected ? builtInSeed : (list.firstArtSeed ?? builtInSeed)}
                    // 收藏单用平台真封面（取不到时 Art 回落种子底）；自建单用第一首歌的图
                    artUri={collected ? listCovers[list.id] : list.firstArtUri}
                    // 播放角标只挂在收藏卡封面上
                    badge={collected}
                    meta={plCardMeta(list, collected)}
                    tint={
                      // 圆点色：收藏卡取平台 tint，自建卡取内置版式色板首色
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
                    artSeed={display.artSeed}
                    artUri={display.artUri}
                    // 历史曲目缺封面时由行内共通补图
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
                    // 最近播放行带 ⋯ 菜单
                    onMore={onOpenMore == null ? undefined : () => { onOpenMore(song) }}
                  />
                )
              })}
            </View>
          )
          : <EmptyTip text={NEW_UI_MINE_EMPTY.recent} />}
      </Section>
    </>
  )
}

const styles = StyleSheet.create({
  /** 最近播放列表：竖排，行间距 2px */
  songList: {
    gap: SONG_ROW.listGap,
  },
})

MinePage.displayName = 'NewUIMinePage'
