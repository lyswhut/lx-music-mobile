import { memo, useMemo } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

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
   * 列表唯一 key：'all' 合并搜索是多平台结果拼接，同一 id 跨平台完全可能撞车，
   * 必须由容器补上 `${source}-${id}`（歌单侧 211 行同款口径），展示层不现查数据。
   */
  key: string
  display: SongDisplay
  /** 曲目本体：行内封面缺失时由 SongRow 共通行为补查（2026-10-12 走查现象 1） */
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
  /** 歌曲行 ⋯（原型搜索结果行有钮，app.js L1466；容器弹单曲操作面板，9e）；不传则不渲染按钮 */
  onSongMore?: (index: number) => void
  onPlPress: (item: ListInfoItem) => void
  onPlayAll: () => void
  /** 空结果里「去设定里看音源」；容器决定怎么回退 */
  onGotoSetting: () => void
  /**
   * 列表内容底部留白（屏底内边距 + 安全区，容器算好传入）。
   * 结果列表自带滚动容器（虚拟化 FlatList），不再借外层 ScrollView 的 contentContainer。
   */
  contentPaddingBottom: number
}

/**
 * 搜索结果内容区（原型 renderSearch 的 box 部分，app.js L1434-1477）：
 * 单曲行（带排名 / 可播态）或歌单卡网格 + 尾注；两类皆空、单类为空两种空态照抄。
 * 纯展示：数据与判定全部由容器传入。原型 tabs 另列在 SearchTabs（常驻于滚动区上方）。
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
  // 轻量宽屏档：pl 网格的列数与卡宽同源（同一档），内容盒限宽也铺在这一屏的滚动容器上，
  // 栅格间隙按档覆盖（medium 16×14 / expanded 16×12，原型 styles.css:1318-1319；竖屏回 CARD_GRID 的 14×12）
  const { columns: gridColumns, boxStyle, rowGap: gridRowGap, columnGap: gridColumnGap } = useWideLayout()
  const plColumnStyle = useMemo(() => ({ gap: gridColumnGap ?? CARD_GRID.columnGap }), [gridColumnGap])
  const plItemStyle = useMemo(() => ({ marginBottom: gridRowGap ?? CARD_GRID.rowGap }), [gridRowGap])

  // —— 加载态：原型是本地 mock 瞬间出结果，真实搜索必须给如实的等待 ——
  if (loading) {
    return (
      <View style={styles.state}>
        <Text style={[styles.loading, { color: theme.colors.text3 }]}>
          {NEW_UI_SEARCH_LOADING}
        </Text>
      </View>
    )
  }

  // —— 两类皆空：词里带「音源 / 平台」时补一枚「到设定页查看音源」胶囊（原型 app.js scEmpty L2329-2333；
  // 点击接线见 SearchScreen handleGotoSetting + utils/tabJump，10b 轮补真） ——
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

  // 真机走查（2026-10-12）：'all' 合并搜索单次可回 30 首/平台 × 多平台 ≈ 上百行，
  // 每行含程序化封面 SVG + 图标 SVG + 双层渐变——原先整摞塞在外层 ScrollView 里
  // 一次性挂载，切 tab 即整列销毁重建，Android 上明显卡顿。
  // 两个 tab 各自改为 FlatList 虚拟化：只挂载屏内约十行，切 tab 的重建成本同比例降下来。
  //
  // 崩溃修复（2026-10-13）：两分支在同一树位置各自 return 一个 FlatList，React 会复用同一
  // 实例原地换 props —— RN 0.73 FlatList.componentDidUpdate（node_modules .../FlatList.js:456）
  // 有 invariant「Changing numColumns on the fly is not supported」，numColumns 1↔2 原地变化
  // 必抛（pl→song 方向还叠着 _checkProps 的「columnWrapperStyle not supported for single
  // column lists」）。RN 官方给的解法就是换 key 强制重挂：下方两个分支各带稳定 key，
  // 切 tab 时销毁旧列表、挂载新列表，不再有原地改列数。
  if (tab === 'song') {
    return (
      <FlatList<SearchResultSong>
        key="newui.search.songList"
        data={songs}
        keyExtractor={item => item.key}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }, boxStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // —— 虚拟化精细化参数（同根因：RN 默认 initialNumToRender=10，首批 mount 不够铺满屏）——
        initialNumToRender={LIST_LOAD_LIMIT}
        maxToRenderPerBatch={14}
        windowSize={7}
        // 不加 removeClippedSubviews：回收单元格里的 SVG 封面在 Android 上有整格变白的老毛病，
        // 虚拟化本身已把挂载行数砍到屏内十条上下，不需要再叠一层原生裁剪
        renderItem={({ item, index }) => (
          <SongRow
            rank={index + 1}
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
            style={styles.songRowGap}
            onPress={() => { onSongPress(index) }}
            onMore={onSongMore == null ? undefined : () => { onSongMore(index) }}
          />
        )}
        ListFooterComponent={
          <>
            {/* 真实结果几十条起，补一枚「播放全部」（与首页同款口径）；原型 mock 只有几条所以没画 */}
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
      // key 带列数：宽屏档改 numColumns 时（转屏 / 平板窗口 resize）RN 0.73 的 FlatList
      // 同样吃「Changing numColumns on the fly is not supported」这条 invariant，
      // 靠换 key 强制重挂（与上面 song/pl 两分支换 key 是同一道防线，见 L165-171 注释）；
      // 竖屏档列数恒为 2，这个 key 也就是恒等于同一个常量——重挂时机与改造前一致（仍只在切 tab 时换）
      key={`newui.search.plGrid-${gridColumns}`}
      data={pls}
      keyExtractor={item => `${item.source}-${item.id}`}
      numColumns={gridColumns}
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }, boxStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      columnWrapperStyle={plColumnStyle}
      // —— 虚拟化精细化参数（同根因：RN 默认 initialNumToRender=10 行 = 20 张卡，可能不够铺满屏）——
      // initialNumToRender 按「行」计，numColumns=2 时 LIST_LOAD_LIMIT=30 item 刚好 15 行，
      // 首批 mount 15 行 = 30 张卡，语义与单曲列表对齐（平台一批最大条数）
      initialNumToRender={Math.max(Math.floor(LIST_LOAD_LIMIT / gridColumns), 8)}
      maxToRenderPerBatch={14}
      windowSize={7}
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
            tint={/* QA 2026-10-14 D-14：歌单卡 meta 行平台色点补齐（原型 .src-dot，app.js L341-343），与首页/歌单页/我的页同口径 */
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
 * 结果分类标签条（原型 .sc-tabs，styles.css L724-730）：
 * 14.5/750 文字 + 11px 计数；选中态亮字 + 底部 17×3 渐变小横条。
 * 原型是 sticky 在滚动区顶，RN 里常驻于 ScrollView 上方（效果一致，见 SearchScreen）。
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
              {/* .sc-tabs em 计数：11 / 600 / 左距 5 / 行内 opacity .65 */}
              <Text
                style={[
                  styles.tabCount,
                  { color: on ? theme.colors.text : theme.colors.text3 },
                ]}
              >
                {count}
              </Text>
            </View>
            {/* ::after 17×3 渐变横条：absolute 底部居中（CSS bottom:-5 → 压在 tabs 下 padding 区） */}
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
  /** .sc-tabs gap:22 / padding:6px 16px 9px */
  tabs: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SEARCH.tabsGap,
    paddingTop: SEARCH.tabsPaddingTop,
    paddingHorizontal: SEARCH.tabsPaddingX,
    paddingBottom: SEARCH.tabsPaddingBottom,
  },
  /** .sc-tabs button position:relative */
  tab: {
    position: 'relative',
  },
  tabPressed: {
    opacity: 0.7,
  },
  /** 14.5 / 750；与计数同一行基线对齐（CSS 里 em 是行内） */
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
  /** ::after left:50% bottom:-5 translateX(-50%) 17×3 r2 */
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
  /** .sc-body padding:0 16（横向内距由原外层 ScrollView 迁入内容容器） */
  scrollContent: {
    paddingHorizontal: SEARCH.bodyPaddingX,
  },
  /** .song-list gap:2 → FlatList 行间距（同 SONG_ROW.listGap） */
  songRowGap: {
    marginBottom: SONG_ROW.listGap,
  },
  /** .pl-grid 的列间（columnWrapperStyle）与行间按宽屏档在渲染期给（plColumnStyle / plItemStyle），
   *  竖屏档逐值回 CARD_GRID 的 12 / 14 基线 */
  /** .sc-hint：11 / mt 16 / 行高 1.7 ≈ 19 */
  hint: {
    marginTop: SEARCH.hintMarginTop,
    fontSize: FONT_SIZE.caption,
    lineHeight: 19,
  },
  /** 加载/空态视图：原借外层滚动容器横向内距，现自带（.sc-empty padding:46px 0 / 居中） */
  state: {
    paddingHorizontal: SEARCH.bodyPaddingX,
  },
  empty: {
    paddingVertical: SEARCH.emptyPaddingY,
    alignItems: 'center',
  },
  /** .sc-empty b：14 / 750 / text-2 / mb 4 */
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
