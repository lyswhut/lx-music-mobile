import { useCallback, useMemo } from 'react'
import { StyleSheet, View, type LayoutChangeEvent, type ListRenderItem } from 'react-native'

import type { ListInfoItem } from '@/store/songlist/state'

// 直连 entry 而非 '@/newui/navigation' 桶口：避免 navigation/index → register → screens → 本文件的循环引用
import { pushNewUiLocalListDetail, pushNewUiSonglistDetail } from '@/newui/navigation/entry'

import {
  ChipRow,
  EmptyTip,
  FootNote,
  HScroll,
  MyPlCard,
  PageHeader,
  PageListView,
  PagingEnd,
  PagingStatus,
  PillButton,
  PlCard,
  PlCount,
  Section,
} from '@/newui/components'
import {
  NEW_UI_BOARD_LIST_ID_PREFIX,
  NEW_UI_PAGING_END_TEXT,
  NEW_UI_PLAYLIST_ART_SEED,
  NEW_UI_PLAYLIST_EMPTY,
  NEW_UI_PLAYLIST_FOOT_NOTE,
  NEW_UI_PLAYLIST_MANAGE,
  NEW_UI_PLAYLIST_STATUS,
  NEW_UI_PLAYLIST_TITLES,
  plPoolCountLabel,
} from '@/newui/const'
import {
  NEW_UI_PLAYLIST_REC_TAG,
  hasPlatformHome,
  selectPlaylistTag,
  useGridItemWidth,
  useMyPlaylistCovers,
  useMyPlaylists,
  usePlaylistCategories,
  usePlaylistChipItems,
  usePlaylistPool,
  usePlaylistTagSelection,
  useWideLayout,
  type MyPlaylistItem,
} from '@/newui/hooks'
import {
  CARD_GRID,
  PLATFORM_TINTS,
  RANK_PAGING,
  type PlatformTintKey,
} from '@/newui/theme'

import type { NewUiPageProps } from '../../types'

/** 推荐池网格的一「行」：最多「当前宽屏档的列数」张卡（竖屏 = CARD_GRID.columns 的 2）；虚拟化以行为回收单位 */
interface PoolRow {
  key: string
  items: ListInfoItem[]
}

/**
 * 歌单页（原型 #page-playlist）容器：分类条 + 我的歌单横排 + 推荐歌单池（分批续取，轮 9）。
 * 数据全部走既有模块：分类/歌单池 = @/core/songlist（沿用用户上次看歌单的平台与排序），
 * 我的歌单 = @/store/list 的 allList + @/core/list 取数量；点卡进新 UI 歌单详情层（阶段 9c）。
 * 视觉交给共通组件（ChipRow / MyPlCard / PlCard / Section / PagingStatus），此处只接数据与动作。
 * 池子分批（原型 app.js L657-679）：每屏落 10 份（PL_POOL_PAGING.pageSize），滚到底续取下一批
 * （先吃本地已有、见底才一页一页往下取并累加）；尾巴状态行与排行榜同一件 PagingStatus、同一语义，
 * 只在真实追加请求在途/失败时露出（在途配 RunningDots 获取动画）；取完收口时列表尾换成共通终点行
 * PagingEnd「没有更多了」（原型 L766 plEndRow）；计数没取完时报「已列出 N / M 个」。
 *
 * —— 2026-10-16 真机 OOM 修复轮：推荐池改「整页虚拟化列表」（路径 A）——
 * 旧形态是 PageViewport 裸 ScrollView 里 `pool.items.map` 全量直出：池子经 usePlaylistPool
 * 分批累加**无上限**（一个分类几百上千份很正常），滚出屏幕的卡片不回收（每张卡 ≈ 8~15 个
 * 原生视图 + Art 恒挂的 LinearGradient + 位图），挂载视图数随池长线性增长 → Yoga 节点撑满
 * Java 堆（OOM 栈顶 YogaNodeJNIBase）。现在本页自带 PageListView（FlatList）作主滚动容器，
 * 卡片按两列成行为虚拟单元，挂载数 = 屏内行 + windowSize 余量，与池长解耦。
 * 页头 / 分类条 / 我的歌单 / 池子标题行进 ListHeaderComponent，状态行与终点行进
 * ListFooterComponent；触底距底 160px 判定、顶栏 pinned、分类条吸顶（CatStickerBar）走
 * 与 PageViewport 同一个 useViewportScroll，滚动信号经 onViewport* props 直回主屏
 * （见 MainScreen 对歌单页的分支）。**不加 removeClippedSubviews**——回收单元格里的 SVG
 * 封面在 Android 上有整格变白的老毛病（SearchResultPanel 同款结论）。
 * usePlaylistPool 的数据语义（每批 10 份、窗口推进、状态机）一字未动。
 * 2026-10-15（拆件转正轮）：`.pl-count` 原内联单元转正为独立组件 PlCount，渲染零变化、文案常量原样。
 */
export const PlaylistPage = ({
  componentId,
  onSwitchTab,
  onOpenPlIdSheet,
  onOpenPlTagsSheet,
  onCatLayoutY,
  onViewportPinnedChange,
  onViewportScrollOffset,
  viewportTopInset = 0,
  viewportBottomInset = 0,
}: NewUiPageProps) => {
  const cats = usePlaylistCategories()
  // 选中分类走共享模块（chip 行与「全部分类」浮层都可写）：切 Tab 页面重挂载后也从这里取回当前选择；
  // 切平台时该共享模块自行把选择复位回首位「推荐」（各平台分类目录互不相通，见 hooks/playlistTagSelection）
  const selection = usePlaylistTagSelection()
  const pool = usePlaylistPool(cats.source, selection.key, cats.sortId)
  const myLists = useMyPlaylists()
  // 2026-10-15 收口：「我的歌单」横排接补图 hook（与「我的」页 PlCard 同一口径，见 useMyPlaylistCovers）——
  // 平台收藏的单子按 source+sourceListId 现查真封面（本机库不存封面字段）；
  // 纯自建 / 存榜条目本就无图，如实留内置版式
  const listCovers = useMyPlaylistCovers(myLists)
  const cardWidth = useGridItemWidth()
  // 宽屏档的列数与栅格间隙（与 cardWidth 同一档，见 useWideLayout）：把池子切成「一行几卡」用列数，
  // 不用写死的 2；间隙 medium 16×14 / expanded 16×12（原型 styles.css:1318-1319），竖屏档就是 14×12
  const { columns: gridColumns, rowGap: gridRowGap, columnGap: gridColumnGap, topBarHeight } = useWideLayout()
  // 行样式缓存成稳定引用（与模块级 styles.row/rowGap 同一条「别每行每次渲染现造对象让 PlCard 的 memo 失效」口径）
  const poolRowStyle = useMemo(() => ({ gap: gridColumnGap ?? CARD_GRID.columnGap }), [gridColumnGap])
  const poolRowGapStyle = useMemo(() => ({ marginTop: gridRowGap ?? CARD_GRID.rowGap }), [gridRowGap])
  // 网格尾巴（状态行 / 终点行）与最后一行卡之间的间隙 = 同一档的行间隙
  const tailGapStyle = useMemo(() => ({ marginTop: gridRowGap ?? CARD_GRID.rowGap }), [gridRowGap])

  // chip 行 = 首位「推荐」+ 平台热门 + 行尾「全部分类」入口（trailing，另行接线）；
  // 装配逻辑已抽共通 hook（QA D-06：原位与主屏吸顶层两处同一口径，见 hooks/playlistChipItems）
  const chipItems = usePlaylistChipItems(cats.items, selection)

  const handleTagSelect = useCallback((key: string) => {
    const hit = chipItems.find(item => item.key === key)
    if (hit) selectPlaylistTag({ key: hit.key, label: hit.label })
  }, [chipItems])

  // 触底续取：距底判定（160px 触发线 + 边沿触发 + 内容变化重估）在自带的 PageListView 里，
  // 与旧 PageViewport 链路同一条 useViewportScroll；这里把信号直连池子 hook。
  // 重取在途时由 hook 内部拦住（busyRef），旧经 usePageEndReached 总线时的那道闸不变
  // ——本页不再注册总线监听（总线仍服务于走主屏 PageViewport 的其余三页：排行榜 / 我的 / 设定）

  // 原型 #plPoolTitle（app.js L764）：选中首位「推荐」→ 「推荐歌单」（整池原样）；选中分类 → 「{分类} · 歌单」
  const poolTitle = useMemo(() => {
    if (selection.key === NEW_UI_PLAYLIST_REC_TAG) return NEW_UI_PLAYLIST_TITLES.pool
    return `${selection.label} · 歌单`
  }, [selection])

  // 原型 .pl-count（paintPlPool L757）：没取完时说清「已列出 N / M 个」，M 用平台真实总数（取不到如实降级，
  // 见 plPoolCountLabel / hook 的占位总数剔除）；加载与首批失败时不显示，避免和提示文案打架
  const countText = pool.loading || pool.error
    ? ''
    : plPoolCountLabel(pool.shownCount, pool.totalCount)

  // 原型 paintPlPool L762：shown < pool.length && (loading || failed) 才挂状态行——
  // 本地推进窗口是同步的，正常续取时这一行不会被看见，只有真实追加请求在途/失败才露出；
  // 正在获取标识（2026-10-15 换动画）：disabled（在途）那句配 RunningDots 三点接力跳动，retry 句裸文字可点
  const showStatus = pool.hasMore && (pool.batchLoading || pool.batchFailed)
  // 原型 L766 else-if 分支：池子取完且窗口全露出（shown >= pool.length）时列表尾收上「没有更多了」
  // —— 与状态行互斥，收尾后滚到底不再对着空白猜「还有没有」
  const showEnd = !pool.hasMore && !pool.loading && pool.items.length > 0

  // 整页空态/错误文案（与改造前 Section 体内三分支同口径，位置从「Section 体」挪到列表尾）
  const poolTip = pool.error
    ? pool.error
    : pool.items.length
      ? null
      : pool.loading ? NEW_UI_PLAYLIST_EMPTY.loading : NEW_UI_PLAYLIST_EMPTY.pool

  // 显示窗口内的卡片按「当前宽屏档的列数」成行（竖屏 = .pl-grid 的 1fr 1fr 两列）：虚拟化以行为单元回收；
  // 行 key 用成员 id 拼接——池子只追加不插入（hook 语义），既有行 key 天然稳定
  // 列数吃 useWideLayout（与 cardWidth 同一档）：竖屏 (<600) 恒等于 CARD_GRID.columns，分档前后逐值一致
  const rows = useMemo<PoolRow[]>(() => {
    const out: PoolRow[] = []
    for (let i = 0; i < pool.items.length; i += gridColumns) {
      const slice = pool.items.slice(i, i + gridColumns)
      out.push({ key: slice.map(item => `${item.source}-${item.id}`).join('|'), items: slice })
    }
    return out
  }, [pool.items, gridColumns])

  const handleMyPlPress = useCallback((list: MyPlaylistItem) => {
    // 从平台导入过的歌单 → 新 UI 歌单详情层（阶段 9c 换线，按平台坐标打开，mine 形态面包屑）。
    // 「存整榜」那份坐标带 board__ 前缀：剥前缀 + rank 形态打开（与我的页同款判定，见 const/songlistDetail）
    if (list.source && list.sourceListId) {
      const isBoard = list.sourceListId.startsWith(NEW_UI_BOARD_LIST_ID_PREFIX)
      pushNewUiSonglistDetail(componentId, {
        id: isBoard
          ? list.sourceListId.slice(NEW_UI_BOARD_LIST_ID_PREFIX.length)
          : list.sourceListId,
        source: list.source,
        name: list.name,
        author: '',
      }, isBoard ? 'rank' : 'mine', 'playlist')
      return
    }
    // 纯自建 / 试听 / 收藏：没有平台坐标，用同一详情页的「本地歌单」形态打开（listId 定位，
    // 2026-10-12 修复：不再是弹一句提示切去「我的」的假动作）
    pushNewUiLocalListDetail(componentId, { id: list.id, name: list.name }, 'playlist')
  }, [componentId])

  const handlePoolPress = useCallback((info: ListInfoItem) => {
    pushNewUiSonglistDetail(componentId, info, 'pl', 'playlist')
  }, [componentId])

  const keyExtractor = useCallback((row: PoolRow) => row.key, [])

  // 一行「当前档列数」张卡（竖屏两卡；列间隙吃本档 .pl-grid 的列向 gap、行向吃行首 margin，首行不吃——
  // 它与池子标题行之间的留白由 Section.head 的 marginBottom（SPACING.md 那一档）提供，与旧 CardGrid 一致）
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

  // —— 列表头：页头 + 分类条 + 我的歌单 + 池子标题行（定长内容，随滚动进出、不参与回收）——
  const listHeader = (
    <View>
      {/* 原型 .page-head + #plOpenBtn（app.js L1597 开 #plIdSheet）：阶段 9f 浮层落地，死按钮换活 */}
      <PageHeader
        title={NEW_UI_PLAYLIST_TITLES.page}
        after={<PillButton icon="link" onPress={onOpenPlIdSheet} />}
      />

      {/* 原型 #catRow：分类 chips = 首位「推荐」+ 当前平台热门（hotTag）+ 行尾「全部分类」入口；
          全量目录来自 getTags().tags，由末尾入口开 PlTagsSheet 浮层逐组选择。
          QA 2026-10-14 D-06：外层 View 把本条在滚动内容里的纵坐标上报主屏（onCatLayoutY），
          分类条越过顶栏下沿时主屏根层 CatStickerBar 接手显示（原型 .cat-row sticky 的等价物）。
          2026-10-16 虚拟化轮：onLayout 的 y 现在相对表头容器（贴在 contentContainer 顶栏留白下沿），
          补回 topbarHeight 后与旧 ScrollView 直报同一坐标系，主屏 handleCatLayoutY 的
          「catLine = y - 顶栏高」换算原样成立。2026-10 宽屏回撞轮：这里的顶栏高与主屏那条都走
          useWideLayout 的 topBarHeight（同一判据、同一档），宽屏档 36 + 46 + 10 = 92 两侧不会错开 */}
      {!cats.loading && !cats.error && cats.items.length > 1 && (
        <View onLayout={(e: LayoutChangeEvent) => { onCatLayoutY?.(topBarHeight(viewportTopInset) + e.nativeEvent.layout.y) }}>
          <ChipRow
            variant="cat"
            items={chipItems}
            activeKey={selection.key}
            onSelect={handleTagSelect}
            trailing={onOpenPlTagsSheet && {
              label: NEW_UI_PLAYLIST_TITLES.allTags,
              onPress: onOpenPlTagsSheet,
            }}
          />
        </View>
      )}

      {/* 2026-11-05 产品撤掉歌单页「我的歌单」横排；统一留在「我的」Tab，歌单页只剩池子 */}

      {/* 池子标题行（Section 无 children：只出头，卡行由列表体承载、尾巴进 ListFooterComponent，
          与旧「Section 头 + CardGrid 体」的间距口径一致：root margin 26 + head margin-bottom 12） */}
      <Section
        sub
        title={poolTitle}
        right={countText ? <PlCount text={countText} /> : undefined}
      />
    </View>
  )

  // —— 列表尾：状态行/终点行（网格尾巴，本档行间隙由 tailGapStyle 承担）或整页空态提示 + 页脚说明 ——
  const listFooter = (
    <View>
      {poolTip ? <EmptyTip text={poolTip} /> : null}
      {!poolTip && (showStatus || showEnd) ? (
        // 原型 .pl-status / .pl-end 是 .pl-grid 直接子项（grid-column:1/-1），与卡行之间隔一个行间隙
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
      <FootNote text={NEW_UI_PLAYLIST_FOOT_NOTE} />
    </View>
  )

  return (
    <PageListView
      data={rows}
      renderItem={renderPoolRow}
      keyExtractor={keyExtractor}
      headerComponent={listHeader}
      footerComponent={listFooter}
      topInset={viewportTopInset}
      bottomInset={viewportBottomInset}
      // 吸顶链路换滚动源的接回（2026-10-16）：顶栏 pinned 与分类条越线判定直发主屏，
      // 计量在 useViewportScroll，与其余三页经 PageViewport 的口径逐字相同
      onPinnedChange={onViewportPinnedChange}
      onScrollOffset={onViewportScrollOffset}
      // 触底续取：距底 160px 触发线（RANK_PAGING，歌单池与排行榜同一条原型口径），
      // 信号直连池子 hook（不再经主屏总线，见上方注释）
      onEndReached={pool.loadNextBatch}
      endReachedDistance={RANK_PAGING.endReachedDistance}
    />
  )
}

const styles = StyleSheet.create({
  /** .pl-grid 的一行：横排本体（列间隙与行间隙按宽屏档在渲染期给，见 poolRowStyle / poolRowGapStyle / tailGapStyle） */
  row: {
    flexDirection: 'row',
  },
})

PlaylistPage.displayName = 'NewUIPlaylistPage'
