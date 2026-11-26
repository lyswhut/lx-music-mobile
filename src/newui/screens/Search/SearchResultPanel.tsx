import { memo, useMemo } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { FixedWindowList } from '@/newui/components/FixedWindowList/FixedWindowList'

import type { ListInfoItem } from '@/store/songlist/state'
import { LIST_LOAD_LIMIT } from '@/core/songlist'

import {
  Chip,
  GhostButton,
  PlCard,
  SongRow,
} from '@/newui/components'
import {
  NEW_UI_HOME_ART_SEED,
  NEW_UI_SEARCH_EMPTY_SUB,
  NEW_UI_SEARCH_GOTO_SETTING,
  NEW_UI_SEARCH_LOADING,
  NEW_UI_SEARCH_SOURCE_HINT_PATTERN,
  NEW_UI_SEARCH_TAB_LABELS,
  newUiSearchEmptyTitle,
  newUiSearchJumpLabel,
  newUiSearchOneSideEmptyTitle,
  newUiSearchOneSideSub,
  newUiSearchPlHint,
  newUiSearchSongHint,
} from '@/newui/const'
import { useGridItemWidth, useWideLayout } from '@/newui/hooks'
import {
  CARD_GRID,
  FONT_SIZE,
  FONT_WEIGHT,
  PLATFORM_TINTS,
  SEARCH,
  SONG_ROW,
  useTheme,
  type PlatformTintKey,
} from '@/newui/theme'
import type { SongDisplay } from '@/newui/utils'

export type NewUiSearchTab = 'song' | 'pl'

/** 容器算好的单曲视图模型（展示层不查数据，只看这份现成的字段） */
export interface SearchResultSong {
  id: string
  /**
   * 列表唯一 key：'all' 合并搜索是多平台结果拼接，同一 id 跨平台会撞车，
   * 由容器补 `${source}-${id}`，展示层不现查数据。
   */
  key: string
  display: SongDisplay
  /** 曲目本体：行内封面缺失时由 SongRow 共通行为补查 */
  music: LX.Music.MusicInfoOnline
  playable: boolean
  active: boolean
  playing: boolean
}

export interface SearchResultPanelProps {
  query: string
  loading: boolean
  tab: NewUiSearchTab
  songs: SearchResultSong[]
  /** 可播数（尾注「其中 N 首能播」与「播放全部」用） */
  playableCount: number
  pls: ListInfoItem[]
  onTabChange: (tab: NewUiSearchTab) => void
  onSongPress: (index: number) => void
  /** 歌曲行 ⋯；不传则不渲染按钮 */
  onSongMore?: (index: number) => void
  onPlPress: (item: ListInfoItem) => void
  onPlayAll: () => void
  /** 空结果里「去设定里看音源」；容器决定怎么回退 */
  onGotoSetting: () => void
  /**
   * 列表内容底部留白（屏底内边距 + 安全区，容器算好传入）。
   * 列表自带 FlatList，不再借外层 ScrollView 的 contentContainer。
   */
  contentPaddingBottom: number
}

/**
 * 搜索结果内容区：单曲行或歌单卡网格 + 尾注，含两类皆空、单类为空两种空态。
 * 纯展示：数据与判定全部由容器传入。
 */
export const SearchResultPanel = memo(({
  query,
  loading,
  tab,
  songs,
  playableCount,
  pls,
  onTabChange,
  onSongPress,
  onSongMore,
  onPlPress,
  onPlayAll,
  onGotoSetting,
  contentPaddingBottom,
}: SearchResultPanelProps) => {
  const theme = useTheme()
  const cardWidth = useGridItemWidth()
  // 宽屏档：pl 网格的列数与卡宽同档，内容盒限宽也铺在这一屏的滚动容器上，
  // 栅格间隙按档覆盖，竖屏回 CARD_GRID 的基线
  const { columns: gridColumns, boxStyle, rowGap: gridRowGap, columnGap: gridColumnGap } = useWideLayout()
  const plColumnStyle = useMemo(() => ({ gap: gridColumnGap ?? CARD_GRID.columnGap }), [gridColumnGap])
  const plItemStyle = useMemo(() => ({ marginBottom: gridRowGap ?? CARD_GRID.rowGap }), [gridRowGap])

  // —— 加载态：真实搜索异步，给如实的等待提示 ——
  if (loading) {
    return (
      <View style={styles.state}>
        <Text style={[styles.loading, { color: theme.colors.text3 }]}>
          {NEW_UI_SEARCH_LOADING}
        </Text>
      </View>
    )
  }

  // —— 两类皆空：词里带「音源 / 平台」时补一枚「到设定页查看音源」胶囊 ——
  if (!songs.length && !pls.length) {
    return (
      <View style={[styles.state, styles.empty]}>
        <Text style={[styles.emptyTitle, { color: theme.colors.text2 }]}>
          {newUiSearchEmptyTitle(query)}
        </Text>
        <Text style={[styles.emptySub, { color: theme.colors.text3 }]}>
          {NEW_UI_SEARCH_EMPTY_SUB}
        </Text>
        {NEW_UI_SEARCH_SOURCE_HINT_PATTERN.test(query) && (
          <Chip
            label={NEW_UI_SEARCH_GOTO_SETTING}
            onPress={onGotoSetting}
            style={styles.emptyChip}
          />
        )}
      </View>
    )
  }

  const curEmpty = tab === 'song' ? !songs.length : !pls.length
  const otherCount = tab === 'song' ? pls.length : songs.length
  const toPl = tab === 'song'

  // —— 单类为空：另一类有结果的「跳过去」 ——
  if (curEmpty) {
    return (
      <View style={[styles.state, styles.empty]}>
        <Text style={[styles.emptyTitle, { color: theme.colors.text2 }]}>
          {newUiSearchOneSideEmptyTitle(query)}
        </Text>
        <Text style={[styles.emptySub, { color: theme.colors.text3 }]}>
          {newUiSearchOneSideSub(otherCount, toPl)}
        </Text>
        <Chip
          label={newUiSearchJumpLabel(otherCount, toPl)}
          onPress={() => onTabChange(toPl ? 'pl' : 'song')}
          style={styles.emptyChip}
        />
      </View>
    )
  }

  // 两个 tab 各自用 FlatList 虚拟化：'all' 合并搜索可达上百行，
  // 一次性挂载时切 tab 整列销毁重建，Android 上明显卡顿。
  //
  // 两分支在同一树位置各自 return 一个 FlatList，React 会复用同一实例原地换 props，
  // 而 RN 0.73 的 FlatList 对 numColumns 1↔N 原地变化会抛 invariant，
  // 故各带稳定 key 强制重挂，避免「Changing numColumns on the fly」崩溃。
  if (tab === 'song') {
    return (
      <FixedWindowList<SearchResultSong>
        key="newui.search.songList"
        data={songs}
        keyExtractor={item => item.key}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }, boxStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // 行高与 SongRow regular 档一致（paddingY×2 + artSize + 上下 1px 透明描边），行距 listGap
        rowHeight={SONG_ROW.paddingY * 2 + SONG_ROW.artSize + 2}
        rowGap={SONG_ROW.listGap}
        renderItem={(item, index) => (
          <SongRow
            artSeed={item.display.artSeed}
            artUri={item.display.artUri}
            musicInfo={item.music}
            title={item.display.title}
            artist={item.display.artist}
            album={item.display.album}
            sourceLabel={item.display.sourceLabel}
            sourceTint={item.display.sourceTint}
            qualityLabel={item.display.qualityLabel}
            durationText={item.display.durationText}
            active={item.active}
            playing={item.playing}
            dimmed={!item.playable}
            onPress={() => { onSongPress(index) }}
            onMore={onSongMore == null ? undefined : () => { onSongMore(index) }}
          />
        )}
        ListFooterComponent={
          <>
            {/* 真实结果几十条起，补一枚「播放全部」（与首页同款口径） */}
            {playableCount > 0 && (
              <GhostButton
                icon="play"
                label={`播放全部 ${playableCount} 首`}
                onPress={onPlayAll}
                style={styles.playAll}
              />
            )}
            <Text style={[styles.hint, { color: theme.colors.text3 }]}>
              {newUiSearchSongHint(songs.length, playableCount)}
            </Text>
          </>
        }
      />
    )
  }

  return (
    <FlatList<ListInfoItem>
      // key 带列数：宽屏档转屏 / 平板 resize 改 numColumns 时同样会触发 RN 0.73 的
      // 「Changing numColumns on the fly」invariant，靠换 key 强制重挂
      key={`newui.search.plGrid-${gridColumns}`}
      data={pls}
      keyExtractor={item => `${item.source}-${item.id}`}
      numColumns={gridColumns}
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }, boxStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      columnWrapperStyle={plColumnStyle}
      // PlCard 高度随屏宽动态变，无法 getItemLayout；
      // initialNumToRender 按行计，至少 12 行，足够铺满屏
      initialNumToRender={Math.max(Math.ceil(LIST_LOAD_LIMIT / gridColumns), 12)}
      maxToRenderPerBatch={4}
      windowSize={8}
      removeClippedSubviews={true}
      renderItem={({ item }) => (
        <View style={plItemStyle}>
          <PlCard
            width={cardWidth}
            title={item.name}
            artSeed={`${NEW_UI_HOME_ART_SEED.playlist}:${item.id}`}
            artUri={item.img ?? undefined}
            meta={[item.play_count, item.total ? `${item.total} 首` : null]
              .filter(Boolean)
              .join(' · ')}
            tint={/* 平台色点，与首页 / 歌单页 / 我的页同口径 */
              PLATFORM_TINTS[item.source as PlatformTintKey]}
            onPress={() => { onPlPress(item) }}
          />
        </View>
      )}
      ListFooterComponent={
        <Text style={[styles.hint, { color: theme.colors.text3 }]}>
          {newUiSearchPlHint(pls.length)}
        </Text>
      }
    />
  )
})

SearchResultPanel.displayName = 'NewUISearchResultPanel'

/**
 * 结果分类标签条：文字 + 计数，选中态亮字 + 底部渐变小横条。
 * 常驻于滚动区上方。
 */
export const SearchTabs = memo(({
  tab,
  songCount,
  plCount,
  onTabChange,
}: {
  tab: NewUiSearchTab
  songCount: number
  plCount: number
  onTabChange: (tab: NewUiSearchTab) => void
}) => {
  const theme = useTheme()
  const entries: ReadonlyArray<readonly [NewUiSearchTab, string, number]> = [
    ['song', NEW_UI_SEARCH_TAB_LABELS.song, songCount],
    ['pl', NEW_UI_SEARCH_TAB_LABELS.pl, plCount],
  ]
  return (
    <View style={styles.tabs}>
      {entries.map(([key, label, count]) => {
        const on = tab === key
        return (
          <Pressable
            key={key}
            onPress={() => { onTabChange(key) }}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <View style={styles.tabTextRow}>
              <Text style={[styles.tabLabel, { color: on ? theme.colors.text : theme.colors.text3 }]}>
                {label}
              </Text>
              {/* 计数 */}
              <Text
                style={[
                  styles.tabCount,
                  { color: on ? theme.colors.text : theme.colors.text3 },
                ]}
              >
                {count}
              </Text>
            </View>
            {/* 底部渐变横条：absolute 居中，压在 tabs 下 padding 区 */}
            {on && (
              <LinearGradient
                colors={[theme.colors.brand, theme.colors.brand2]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.tabIndicator}
              />
            )}
          </Pressable>
        )
      })}
    </View>
  )
})

SearchTabs.displayName = 'NewUISearchTabs'

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SEARCH.tabsGap,
    paddingTop: SEARCH.tabsPaddingTop,
    paddingHorizontal: SEARCH.tabsPaddingX,
    paddingBottom: SEARCH.tabsPaddingBottom,
  },
  /** 相对定位，给底部指示条作锚 */
  tab: {
    position: 'relative',
  },
  tabPressed: {
    opacity: 0.7,
  },
  /** 文字与计数同行、基线对齐 */
  tabTextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tabLabel: {
    fontSize: FONT_SIZE.title,
    fontWeight: FONT_WEIGHT.extraBold,
  },
  tabCount: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semibold,
    marginLeft: SEARCH.tabCountMarginLeft,
    opacity: SEARCH.tabCountOpacity,
  },
  /** 底部渐变指示条 */
  tabIndicator: {
    position: 'absolute',
    bottom: -SEARCH.tabIndicatorPad,
    alignSelf: 'center',
    width: SEARCH.tabIndicatorWidth,
    height: SEARCH.tabIndicatorHeight,
    borderRadius: SEARCH.tabIndicatorRadius,
  },
  playAll: {
    marginTop: 12,
  },
  /** 结果区自带滚动容器（FlatList）；外层屏容器只给 flex:1 */
  scroll: {
    flex: 1,
  },
  /** 横向内距（由外层 ScrollView 迁入内容容器） */
  scrollContent: {
    paddingHorizontal: SEARCH.bodyPaddingX,
  },
  /** 尾注（pl 网格行间距由渲染期 plColumnStyle / plItemStyle 给出） */
  hint: {
    marginTop: SEARCH.hintMarginTop,
    fontSize: FONT_SIZE.caption,
    lineHeight: 19,
  },
  /** 加载/空态视图：自带横向内距 */
  state: {
    paddingHorizontal: SEARCH.bodyPaddingX,
  },
  empty: {
    paddingVertical: SEARCH.emptyPaddingY,
    alignItems: 'center',
  },
  /** 空态标题 */
  emptyTitle: {
    fontSize: FONT_SIZE.rank,
    fontWeight: FONT_WEIGHT.extraBold,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: FONT_SIZE.smallLg,
    lineHeight: SEARCH.emptyLineHeight,
    textAlign: 'center',
  },
  emptyChip: {
    marginTop: 14,
  },
  loading: {
    marginTop: 40,
    fontSize: FONT_SIZE.smallLg,
    textAlign: 'center',
  },
})
