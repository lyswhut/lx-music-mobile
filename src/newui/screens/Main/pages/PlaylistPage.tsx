import { useCallback, useMemo } from 'react'
import { StyleSheet, View, type ListRenderItem } from 'react-native'

import type { ListInfoItem } from '@/store/songlist/state'

import { pushNewUiSonglistDetail } from '@/newui/navigation/entry'

import {
  ChipRow,
  EmptyTip,
  PageListView,
  PagingEnd,
  PagingStatus,
  PlCard,
  PlCount,
  Section,
} from '@/newui/components'
import {
  NEW_UI_PAGING_END_TEXT,
  NEW_UI_PLAYLIST_ART_SEED,
  NEW_UI_PLAYLIST_EMPTY,
  NEW_UI_PLAYLIST_STATUS,
  NEW_UI_PLAYLIST_TITLES,
  plPoolCountLabel,
} from '@/newui/const'
import {
  NEW_UI_PLAYLIST_REC_TAG,
  selectPlaylistTag,
  useGridItemWidth,
  usePlaylistCategories,
  usePlaylistChipItems,
  usePlaylistPool,
  usePlaylistTagSelection,
  useWideLayout,
} from '@/newui/hooks'
import {
  CARD_GRID,
  LAYOUT,
  PLATFORM_TINTS,
  RANK_PAGING,
  type PlatformTintKey,
} from '@/newui/theme'

import type { NewUiPageProps } from '../../types'

/** 推荐池网格的一「行」：最多「当前档列数」张卡（竖屏 = CARD_GRID.columns，现 3）；虚拟化以行为回收单位 */
interface PoolRow {
  key: string
  items: ListInfoItem[]
}

/**
 * 歌单页容器：分类 chip 行（吸顶常驻）+ 推荐歌单池（分批续取，点卡进歌单详情层）。
 * 分类条放在列表外层固定位置：列表内容只在其下方滚动，滚不走、也不需要复制浮层；
 * 条内顶部留白等于顶栏总高，与旧「列表头里随内容滚走」的静止观感逐像素一致。
 * 整页用 PageListView 按行虚拟化，池子分批无上限累加时挂载视图数仍与池长解耦；
 * 页头 / 状态行 / 终点行与排行榜同语义，触底与顶栏 pinned 信号直回主屏。
 */
export const PlaylistPage = ({
  componentId,
  onSwitchTab,
  onOpenPlTagsSheet,
  onViewportPinnedChange,
  viewportTopInset = 0,
  viewportBottomInset = 0,
}: NewUiPageProps) => {
  const cats = usePlaylistCategories()
  // 选中分类走共享模块（chip 行与「全部分类」浮层都可写），切平台时自动复位回「推荐」
  const selection = usePlaylistTagSelection()
  const pool = usePlaylistPool(cats.source, selection.key, cats.sortId)
  const cardWidth = useGridItemWidth()
  // 宽屏档的列数与栅格间隙：池子按当前列数切行，间隙随档位变化；
  // boxStyle / topBarHeight 供吸顶分类条与列表顶部让位使用（与 PageListView 同一判据）
  const { columns: gridColumns, rowGap: gridRowGap, columnGap: gridColumnGap, boxStyle, topBarHeight } = useWideLayout()
  // 行样式缓存成稳定引用，避免每行现造对象让 PlCard 的 memo 失效
  const poolRowStyle = useMemo(() => ({ gap: gridColumnGap ?? CARD_GRID.columnGap }), [gridColumnGap])
  const poolRowGapStyle = useMemo(() => ({ marginTop: gridRowGap ?? CARD_GRID.rowGap }), [gridRowGap])
  // 网格尾巴（状态行 / 终点行）与最后一行卡之间的间隙 = 同一档的行间隙
  const tailGapStyle = useMemo(() => ({ marginTop: gridRowGap ?? CARD_GRID.rowGap }), [gridRowGap])

  // chip 行 = 「推荐」+ 平台热门 + 行尾「全部分类」，装配逻辑见 hooks/playlistChipItems
  const chipItems = usePlaylistChipItems(cats.items, selection)

  const handleTagSelect = useCallback((key: string) => {
    const hit = chipItems.find(item => item.key === key)
    if (hit) selectPlaylistTag({ key: hit.key, label: hit.label })
  }, [chipItems])

  // 触底续取：距底判定在自带 PageListView 里，信号直连池子 hook；
  // 重取在途由 hook 内部拦住，本页不注册 usePageEndReached 总线

  // 标题：选中「推荐」→「推荐歌单」，选中分类 →「{分类} · 歌单」
  const poolTitle = useMemo(() => {
    if (selection.key === NEW_UI_PLAYLIST_REC_TAG) return NEW_UI_PLAYLIST_TITLES.pool
    return `${selection.label} · 歌单`
  }, [selection])

  // 计数：没取完时报「已列出 N / M 个」，M 用平台真实总数；加载与首批失败时不显示
  const countText = pool.loading || pool.error
    ? ''
    : plPoolCountLabel(pool.shownCount, pool.totalCount)

  // 状态行只在真实追加请求在途 / 失败时露出（本地推进窗口是同步的，正常续取看不到）；
  // 在途那句配 RunningDots 动画，retry 句裸文字可点
  const showStatus = pool.hasMore && (pool.batchLoading || pool.batchFailed)
  // 池子取完且全部露出时列表尾收上「没有更多了」，与状态行互斥
  const showEnd = !pool.hasMore && !pool.loading && pool.items.length > 0

  // 整页空态 / 错误文案（挂在列表尾）
  const poolTip = pool.error
    ? pool.error
    : pool.items.length
      ? null
      : pool.loading ? NEW_UI_PLAYLIST_EMPTY.loading : NEW_UI_PLAYLIST_EMPTY.pool

  // 卡片按当前档列数成行，虚拟化以行为回收单元；
  // 行 key 用成员 id 拼接——池子只追加不插入，既有行 key 天然稳定
  const rows = useMemo<PoolRow[]>(() => {
    const out: PoolRow[] = []
    for (let i = 0; i < pool.items.length; i += gridColumns) {
      const slice = pool.items.slice(i, i + gridColumns)
      out.push({ key: slice.map(item => `${item.source}-${item.id}`).join('|'), items: slice })
    }
    return out
  }, [pool.items, gridColumns])

  const handlePoolPress = useCallback((info: ListInfoItem) => {
    pushNewUiSonglistDetail(componentId, info, 'pl', 'playlist')
  }, [componentId])

  const keyExtractor = useCallback((row: PoolRow) => row.key, [])

  // 一行「当前档列数」张卡：列间隙吃本档列向 gap，行间距吃行首 margin（首行不吃）
  const renderPoolRow = useCallback<ListRenderItem<PoolRow>>(({ item, index }) => (
    <View style={[styles.row, poolRowStyle, index > 0 ? poolRowGapStyle : null]}>
      {item.items.map(pl => (
        <PlCard
          key={`${pl.source}-${pl.id}`}
          width={cardWidth}
          title={pl.name}
          artSeed={`${NEW_UI_PLAYLIST_ART_SEED.pool}:${pl.id}`}
          artUri={pl.img ?? undefined}
          tint={PLATFORM_TINTS[pl.source as PlatformTintKey]}
          meta={[pl.play_count, pl.total ? `${pl.total} 首` : null]
            .filter(Boolean)
            .join(' · ')}
          onPress={() => handlePoolPress(pl)}
        />
      ))}
    </View>
  ), [cardWidth, handlePoolPress, poolRowGapStyle, poolRowStyle])

  // —— 列表头：池子标题行（分类条已上移到吸顶层，不参与滚动）——
  // 分类条成了常驻横条后，Section 默认的 26 上间距（叠上分类条自身 4 下内距）观感偏空，
  // 本页收到 14，标题与分类条之间不再出现一条大留白
  const listHeader = (
    <Section
      sub
      style={styles.poolSection}
      title={poolTitle}
      right={countText ? <PlCount text={countText} /> : undefined}
    />
  )

  // —— 列表尾：状态行 / 终点行或整页空态提示 ——
  const listFooter = (
    <View>
      {poolTip ? <EmptyTip text={poolTip} /> : null}
      {!poolTip && (showStatus || showEnd) ? (
        // 状态行 / 终点行与卡行之间隔一个行间隙
        <View style={tailGapStyle}>
          {showStatus ? (
            <PagingStatus
              disabled={pool.batchLoading}
              loading={pool.batchLoading}
              text={pool.batchFailed ? NEW_UI_PLAYLIST_STATUS.retry : NEW_UI_PLAYLIST_STATUS.loading}
              onPress={pool.loadMore}
            />
          ) : null}
          {showEnd ? <PagingEnd inGrid text={NEW_UI_PAGING_END_TEXT} /> : null}
        </View>
      ) : null}
    </View>
  )

  return (
    <View style={styles.root}>
      {/* 吸顶分类条：位于列表外层，列表内容只在其下方滚动；顶部留白对齐顶栏总高，
          无分类数据时也保留这层让位，避免标题行钻到顶栏底下 */}
      <View style={[styles.catBar, boxStyle, { paddingTop: topBarHeight(viewportTopInset) }]}>
        {!cats.loading && !cats.error && cats.items.length > 0 && (
          <ChipRow
            variant="cat"
            items={chipItems}
            activeKey={selection.key}
            onSelect={handleTagSelect}
            trailing={onOpenPlTagsSheet && {
              label: NEW_UI_PLAYLIST_TITLES.allTagsChip,
              onPress: onOpenPlTagsSheet,
            }}
          />
        )}
      </View>

      <PageListView
        data={rows}
        renderItem={renderPoolRow}
        keyExtractor={keyExtractor}
        headerComponent={listHeader}
        footerComponent={listFooter}
        topInset={viewportTopInset}
        bottomInset={viewportBottomInset}
        // 顶部让位已由吸顶分类条在列表外承担：清掉 PageListView 自带的顶栏留白，
        // 否则标题行会与分类条之间多出一整条顶栏高
        contentContainerStyle={styles.listContent}
        // 顶栏 pinned 的滚动信号直发主屏，计量口径与其余三页一致
        onPinnedChange={onViewportPinnedChange}
        // 触底续取：距底 160px 触发线，信号直连池子 hook
        onEndReached={pool.loadNextBatch}
        endReachedDistance={RANK_PAGING.endReachedDistance}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** 吸顶分类条：横向内距与列表内容一致，chip 行仍靠负 margin 贴屏边横滑 */
  catBar: {
    paddingHorizontal: LAYOUT.screenPaddingX,
  },
  /** 列表内容顶部不再留顶栏高（由上方分类条让位） */
  listContent: {
    paddingTop: 0,
  },
  /** 池子标题行：贴近上方吸顶分类条（分类条底部另有 4 内距） */
  poolSection: {
    marginTop: 14,
  },
  /** 一行：横排本体（间隙按宽屏档在渲染期给） */
  row: {
    flexDirection: 'row',
  },
})

PlaylistPage.displayName = 'NewUIPlaylistPage'
