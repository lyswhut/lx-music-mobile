import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, BackHandler, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Navigation } from 'react-native-navigation'

import { LIST_LOAD_LIMIT } from '@/core/songlist'

import { Art } from '@/newui/components/Art'
import { HScroll } from '@/newui/components/HScroll'
import { Icon } from '@/newui/components/Icon'
import { MinibarHost } from '@/newui/components/Minibar'
import { useViewportScroll } from '@/newui/components/PageViewport'
import { PagingEnd } from '@/newui/components/PagingEnd'
import { PagingStatus } from '@/newui/components/PagingStatus'
import { PodcastRow } from '@/newui/components/PodcastRow'
import { PlTop } from '@/newui/components/PlTop'
import { NewUiToastHost } from '@/newui/components/Toast'
import { NEW_UI_PAGING_END_TEXT } from '@/newui/const/app'
import { NEW_UI_POD_REGION_DEFAULT, newUiPodArtSeed, podRegionLabel } from '@/newui/const/radio'
import {
  NEW_UI_RADIO_HOME_CRUMB,
  NEW_UI_RADIO_HOME_LABELS,
  NEW_UI_RADIO_HOME_REGION,
  NEW_UI_RADIO_HOME_STATUS,
  NEW_UI_RADIO_HOME_SUBS,
  NEW_UI_RADIO_HOME_TOAST,
} from '@/newui/const/radioHome'
import {
  podDurationText,
  usePodcastChart,
  usePodProgress,
  usePodSubs,
  type PodProgressState,
  type PodShowRow,
  type PodSubEntry,
} from '@/newui/podcast'
import { useNewUiSystemBar, usePressFx, useSafeArea, useWideLayout } from '@/newui/hooks'
// 直连 entry 而非 '@/newui/navigation' 桶口：避免 navigation/index → register → screens → 本文件的循环引用
import { pushNewUiPodcastDetail, pushNewUiPodcastSearch } from '@/newui/navigation/entry'
import {
  CONTROL,
  FONT_SIZE,
  FONT_WEIGHT,
  LETTER_SPACING,
  MOTION,
  PL_LAYER,
  POD,
  POD_CHART_PAGING,
  useTheme,
} from '@/newui/theme'
import { showNewUiToast } from '@/newui/utils'

import { PodRegionSheet } from './sheets/PodRegionSheet'

/** `.subs-card:active{transform:scale(.96)}`（styles.css L378，`transition:.2s`） */
const SUBS_CARD_PRESS_SCALE = 0.96
/** `.subs-x` 原型没写 `:active`，沿用 `.icon-btn` 家族那一档（.9，见件内说明） */
const SUBS_X_PRESS_SCALE = 0.9

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface RadioHomeScreenProps {
  componentId: string
}

/**
 * 电台首页（原型 `#radioLayer`，U81 `parts/radio/home.{html,css}`；装配逻辑 app.js
 * `openRadio` L1799 / `renderPodSub` L1812 / `renderPodRegion` L1856 / `renderPodChart` L1927 /
 * `podChartScroll` L1985）。全屏右推层，与歌单详情、搜歌同一套路由（index.html L748）。
 *
 * **滚动结构（本屏唯一一根轴）**——原型这轮把「整层一张滚动面」作废，改成上半固定（home.css 件头）：
 * `#radioLayer{padding:0;overflow:hidden}` → 固定段 `.pl-head{flex:none;padding:58px 16px 0}`
 * → 滚动段**就是 `.pod-list` 自己**（`#radioLayer>.pod-list{flex:1;overflow-y:auto;padding:10px 16px 34px}`）。
 * RN 落法（契约 7.4）：屏根 `View{flex:1}` → 钉住段 `View{flex:none}`（顶排 + 订阅那一区 + 当前地区那一行）
 * → 榜列 `FlatList{flex:1}`。**不给顶栏做 sticky**（顶排本来就在钉住段里，index.html L766 逐字）。
 * 状态行 / 终点行是**列表自己的 footer cell**（跟着滚、留在列表尾），不是钉住区。
 *
 * 虚拟化：裸 `FlatList` + 共通件 `useViewportScroll` 的**距底 160px** 判据（与原型 `podChartScroll`
 * 逐字等价），**本轮不引 FlashList、不用 `PageListView`**（它的 contentContainer 自带 TabBar 语义），
 * 也**不开 `removeClippedSubviews`**（回收单元里的 SVG 封面在 Android 有整格变白的老毛病，
 * `PageListView.tsx:46-47` 判例）。每批 10 行、50 条封顶——`usePodcastChart.loadNextBatch`
 * 是**本地切片推进**（接口一次给 50），不发请求。
 *
 * 纯 UI 层：取数（`@/newui/podcast`）、本机订阅与进度（同层 hook）全部复用，本屏不写任何 fetch；
 * 取消收听只改本机名单。地区抽屉是**屏内层状态**（不走 RNN Modal / 新路由）。
 */
export const RadioHomeScreen = ({ componentId }: RadioHomeScreenProps) => {
  const theme = useTheme()
  const { top, bottom } = useSafeArea()
  const { wide, layerPaddingX } = useWideLayout()
  useNewUiSystemBar(componentId)

  // 每次进这一屏都固定在默认区（原型 POD_REGION_DEFAULT，index.html L760），不记上次区
  const [country, setCountry] = useState(NEW_UI_POD_REGION_DEFAULT)
  const [regionSheetVisible, setRegionSheetVisible] = useState(false)

  const chart = usePodcastChart(country)
  // 本机名单（`usePodSubs` 每次返回新对象，这里把三样拆出来：remove 是模块级函数、引用稳定，
  // 因此 handleUnsub 不会每渲染换一次身份，订阅卡不会因为回调引用变化整排重渲染）
  const { subs: subEntries, count: subCount, remove: unsub } = usePodSubs()
  const progress = usePodProgress()

  const listRef = useRef<FlatList<PodShowRow>>(null)

  const goBack = useCallback(() => {
    void Navigation.pop(componentId)
  }, [componentId])

  // 硬件返回键与头部那颗同一条出口（原型「一次只收最上面那一层」，index.html L748；
  // 写法照 SonglistDetailScreen L382-401 的详情层判例：本页存续期间始终注册，消费后走 goBack）。
  // 抽屉开着时 Sheet 自己的监听注册更晚、RN 按后注册先消费 → 先收抽屉，不会连带退层。
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack()
      return true
    })
    return () => { subscription.remove() }
  }, [goBack])

  // 进层与换区都把这根轴归零（原型 podChartAxis().scrollTop = 0，openRadio L1806 / loadPodRegion L1955）
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false })
  }, [country])

  // 顶排右上那颗 `#podSearchBtn`（搜节目，U83）：转场归 entry.ts，本屏只调
  const handleSearchPress = useCallback(() => {
    pushNewUiPodcastSearch(componentId)
  }, [componentId])

  // 榜行 → U82：只交详情屏要用的那五项（契约 7.3④，名次与 feedUrl 不过原生桥）
  const handleShowPress = useCallback((show: PodShowRow) => {
    pushNewUiPodcastDetail(componentId, {
      id: show.id,
      name: show.name,
      by: show.by,
      tags: show.tags,
      artworkUrl: show.artworkUrl,
    })
  }, [componentId])

  // 订阅卡 → U82：本机名单只存了 id / 名 / 作者 / 封面四栏，分类词如实给空数组
  // （榜单接口①本来就给不出 tags 与集数，不是本机名单缺字段）
  const handleSubPress = useCallback((entry: PodSubEntry) => {
    pushNewUiPodcastDetail(componentId, {
      id: entry.id,
      name: entry.name,
      by: entry.by,
      tags: [],
      artworkUrl: entry.artworkUrl,
    })
  }, [componentId])

  const handleUnsub = useCallback((entry: PodSubEntry) => {
    // 原型 unsubPod L1844-1847：只改本机名单，改完给一句反馈
    unsub(entry.id)
    showNewUiToast(NEW_UI_RADIO_HOME_TOAST.unsubbed)
  }, [unsub])

  const handlePickRegion = useCallback((key: string) => {
    setCountry(key)
  }, [])

  const handleEndReached = useCallback(() => {
    if (chart.loading || !chart.hasMore) return
    chart.loadNextBatch()
  }, [chart])

  const scrollHandlers = useViewportScroll({
    onEndReached: handleEndReached,
    endReachedDistance: POD_CHART_PAGING.endReachedDistance,
  })

  const renderItem = useCallback(({ item, index }: { item: PodShowRow, index: number }) => (
    <PodcastRow
      name={item.name}
      by={item.by}
      tags={item.tags}
      artSeed={newUiPodArtSeed(item.id)}
      artUri={item.artworkUrl}
      // 名次是数组序 +1，不是接口字段（app.js podRow L1900）
      rank={index + 1}
      onPress={() => { handleShowPress(item) }}
    />
  ), [handleShowPress])

  const keyExtractor = useCallback((item: PodShowRow) => item.id, [])

  /* 换区在途时榜列整个清空，只留状态行那一条（原型 renderPodChart L1928-1935：先 `box.innerHTML = ''`
     再走 `podFetching` 分支）。`usePodcastChart` 取数期间仍留着上一区的行（换区成功才覆盖），
     不清的话钉住段那行已经换成新区的区名、下面挂着的却还是旧区名单——名实不符。 */
  const chartRows = chart.loading ? [] : chart.rows

  /* —— footer cell：`.pl-status` 两条与收行 `.pl-end`（原型 renderPodChart L1927-1944）——
     在途 → 不可点的「正在载入这一区…」；这一区没名单（失败或取回就是空）→ 可点的
     「这一区没有取到名单 · 点击重试」；还有没铺完的批次 → 什么都不摆（本地切片没有「载入下一批」这件事，
     滚动触底就铺）；铺完 → 「没有更多了」。 */
  const listFooter = useMemo(() => {
    if (chartRows.length === 0) {
      return chart.loading
        ? <PagingStatus disabled loading text={NEW_UI_RADIO_HOME_STATUS.regionLoading} />
        : <PagingStatus text={NEW_UI_RADIO_HOME_STATUS.regionFailed} onPress={chart.retry} />
    }
    if (chart.hasMore) return null
    return <PagingEnd text={NEW_UI_PAGING_END_TEXT} />
  }, [chart.hasMore, chart.loading, chart.retry, chartRows.length])

  /**
   * 钉住段的内衬：`.pl-head{padding:58px 16px 0}`，58 含假机框状态栏 → 真机 = 实测状态栏 + 6。
   * 宽屏档（`useWideLayout`）换成 `.wide .pl-head{padding:36px max(16px,calc((100% - 620px)/2)) 0}`
   * （styles.css:1337）：顶内衬回正到这一档 32 状态栏之上的 4（36 − 32），
   * 左右吃那根 620 居中轴算出来的内衬；compact 两侧都回基线，零变化。
   */
  const headStyle = useMemo(() => ({
    paddingTop: top + (wide?.statusReserve ?? PL_LAYER.paddingTopReserve),
    paddingHorizontal: layerPaddingX ?? PL_LAYER.paddingX,
  }), [top, wide, layerPaddingX])

  /**
   * 滚动段自己的内衬（home.css L366 `padding:10px 16px 34px`），底部补真机安全区。
   * 左右同一根轴：`.wide #radioLayer>.pod-list{padding-left/right:max(16px,calc((100% - 620px)/2))}`
   * （styles.css:1339），竖向三位（10 / 34）原型这一档不动，继续吃基线。
   */
  const listContentStyle = useMemo(() => ({
    paddingTop: POD.listAxisPaddingTop,
    paddingHorizontal: layerPaddingX ?? POD.listAxisPaddingX,
    paddingBottom: POD.listAxisPaddingBottom + bottom,
  }), [bottom, layerPaddingX])

  return (
    <View nativeID="newui.radio.content" style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      {/* ▸ 钉住段（.pl-head）：顶排 + 订阅那一区 + 当前地区那一行，三段都不滚 */}
      <View style={[styles.pinned, headStyle]}>
        <PlTop
          crumbText={NEW_UI_RADIO_HOME_CRUMB}
          backLabel={NEW_UI_RADIO_HOME_LABELS.back}
          onBack={goBack}
          right={{
            kind: 'icon',
            name: 'search',
            label: NEW_UI_RADIO_HOME_LABELS.search,
            onPress: handleSearchPress,
          }}
        />

        {/* .subs-block：我听的（本机名单，接口读不到也写不回） */}
        <View style={styles.subsBlock}>
          <View style={styles.subsHead}>
            <Text style={[styles.subsHeadTitle, { color: theme.colors.text }]}>
              {NEW_UI_RADIO_HOME_SUBS.title}
            </Text>
            {subCount > 0 && (
              <Text style={[styles.subsHeadCount, { color: theme.colors.text3 }]}>
                {NEW_UI_RADIO_HOME_SUBS.count(subCount)}
              </Text>
            )}
          </View>
          {subCount === 0
            ? (
              /* .subs-empty：空了不塌成一条（与首页「继续收听」同一处理），是色块不是 EmptyTip 那族小字 */
              <View style={[styles.subsEmpty, { backgroundColor: theme.colors.card, borderColor: theme.colors.hairline }]}>
                <Text style={[styles.subsEmptyText, { color: theme.colors.text3 }]}>
                  {NEW_UI_RADIO_HOME_SUBS.empty}
                </Text>
              </View>
              )
            : (
              <HScroll>
                {subEntries.map(entry => (
                  <SubsCard
                    key={entry.id}
                    entry={entry}
                    remainingText={leftRemainingText(progress, entry.id)}
                    onPress={() => { handleSubPress(entry) }}
                    onUnsub={() => { handleUnsub(entry) }}
                  />
                ))}
              </HScroll>
              )}
        </View>

        {/* .pod-region：左边回显当前这一区，右边那颗（跨件原子 .section-more，屏内内联）开抽屉 */}
        <View style={styles.regionRow}>
          <Text style={[styles.regionNow, { color: theme.colors.text }]}>
            {podRegionLabel(country)}
          </Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={CONTROL.moreHitSlop}
            onPress={() => { setRegionSheetVisible(true) }}
            style={styles.regionMore}
          >
            {({ pressed }) => (
              <>
                <Text
                  style={[
                    styles.regionMoreText,
                    { color: pressed ? theme.colors.text2 : theme.colors.text3 },
                  ]}
                >
                  {NEW_UI_RADIO_HOME_REGION.more}
                </Text>
                <Icon
                  name="chevron"
                  size={CONTROL.moreIconSize}
                  color={pressed ? theme.colors.text2 : theme.colors.text3}
                  style={styles.regionMoreIcon}
                />
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* ▸ 滚动段：榜列自己就是这一屏唯一的轴（home.css L366），.pod-list 的 margin-top:2 落在容器外沿 */}
      <FlatList
        ref={listRef}
        style={styles.list}
        data={chartRows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListFooterComponent={listFooter}
        // LIST_LOAD_LIMIT=30：覆盖榜列固定 50 条中首批可挂载量；maxToRenderPerBatch/windowSize 同 SonglistDetailScreen
        initialNumToRender={LIST_LOAD_LIMIT}
        maxToRenderPerBatch={14}
        windowSize={9}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={MOTION.scrollThrottle}
        contentContainerStyle={listContentStyle}
        onScroll={scrollHandlers.onScroll}
        onContentSizeChange={scrollHandlers.onContentSizeChange}
        onLayout={scrollHandlers.onLayout}
      />

      {/* 常驻迷你播放条：本层默认磁吸圆点（原型 miniPageSnapped：不在首页就是圆点）。
          排在地区抽屉与提示胶囊之前——圆点浮在榜列内容之上，抽屉面板仍盖过它 */}
      <MinibarHost componentId={componentId} bottomInset={bottom} defaultSnapped />
      {/* U85 地区抽屉：屏内 absolute-fill 覆盖层，不走 RNN Modal / 新路由（Sheet.tsx 头注口径） */}
      <PodRegionSheet
        visible={regionSheetVisible}
        country={country}
        onPick={handlePickRegion}
        onClose={() => { setRegionSheetVisible(false) }}
        bottomInset={bottom}
      />

      <NewUiToastHost bottomInset={bottom} />
    </View>
  )
}

RadioHomeScreen.displayName = 'NewUIRadioHomeScreen'

/**
 * 订阅卡（原型 `.subs-wrap` + `.subs-card`，home.css L26-L41）：132 封面（圆角 16）+ 两行节目名
 * +「还剩 X」那一行（**没听过就不写这一行**，app.js L1832，不编「未听」这种话）。
 * 右上角 `.subs-x` = 取消收听，按下不冒泡到卡（RN 内层 Pressable 抢到 responder，
 * 与原型 `e.stopPropagation()` 同一件事）。屏内内联：卡体只在这一处出现，不抽件。
 */
const SubsCard = ({
  entry,
  remainingText,
  onPress,
  onUnsub,
}: {
  entry: PodSubEntry
  remainingText: string | null
  onPress: () => void
  onUnsub: () => void
}) => {
  const theme = useTheme()
  // `.subs-card:active{transform:scale(.96)}`：卡片类按原型缩放，200ms 缓动
  const cardFx = usePressFx({ scale: SUBS_CARD_PRESS_SCALE })
  // 取消收听那颗 22dp 小圆贴片按 `.icon-btn` 家族同一档收缩（原型没给 `.subs-x:active`）
  const unsubFx = usePressFx({ scale: SUBS_X_PRESS_SCALE })
  return (
    <View style={styles.subsWrap}>
      <AnimatedPressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={cardFx.onPressIn}
        onPressOut={cardFx.onPressOut}
        style={[styles.subsCard, cardFx.animatedStyle]}
      >
        <Art
          width={POD.subsArtSize}
          height={POD.subsArtSize}
          radius={POD.subsArtRadius}
          seed={newUiPodArtSeed(entry.id)}
          imageUri={entry.artworkUrl}
        />
        <Text
          numberOfLines={2}
          style={[styles.subsName, { color: theme.colors.text }]}
        >
          {entry.name}
        </Text>
        {remainingText != null && (
          <Text style={[styles.subsLeft, { color: theme.colors.text3 }]} numberOfLines={1}>
            {remainingText}
          </Text>
        )}
      </AnimatedPressable>
      {/* .subs-x：玻璃贴片底（--glass + --glass-ink + inset 1px --line，home.css L37-L41）。
          原型带 backdrop-filter blur(10)：22dp 的小圆贴片上模糊几乎不可辨，且新 GLASS 规格位要动
          tokens.ts（本轮禁改），故只取 glassPatch 染色 + line 描边这一档，模糊留作设备验收后的单点决定。 */}
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={NEW_UI_RADIO_HOME_LABELS.unsub(entry.name)}
        onPress={onUnsub}
        onPressIn={unsubFx.onPressIn}
        onPressOut={unsubFx.onPressOut}
        hitSlop={CONTROL.moreHitSlop}
        style={[
          styles.subsX,
          {
            backgroundColor: theme.colors.glassPatch,
            borderColor: theme.colors.line,
          },
          unsubFx.animatedStyle,
        ]}
      >
        <Icon
          name="close"
          size={POD.subsXIconSize}
          color={theme.colors.glassPatchInk}
        />
      </AnimatedPressable>
    </View>
  )
}

SubsCard.displayName = 'NewUISubsCard'

/** 本机进度 → 「还剩 X」那一行的字；没听过返回 null（整行不渲染） */
const leftRemainingText = (
  progress: PodProgressState,
  id: string,
): string | null => {
  const record = progress.progressOf(id)
  return record == null ? null : NEW_UI_RADIO_HOME_SUBS.remaining(podDurationText(record.left))
}

const styles = StyleSheet.create({
  /** .pl-layer{padding:0;overflow:hidden} → RN 屏根就是「不滚的壳」 */
  root: {
    flex: 1,
  },
  /** .pl-head{flex:none}（内衬由 headStyle 在渲染期给，安全区随设备变）：RN 无 'none'，展开成不伸不缩 */
  pinned: {
    flexGrow: 0,
    flexShrink: 0,
  },
  /** 榜列 = 本屏唯一的轴（#radioLayer>.pod-list{flex:1}），.pod-list{margin-top:2px} 落在这里 */
  list: {
    flex: 1,
    marginTop: POD.listMarginTop,
  },

  /* —— .subs-block（home.css L18-L41）—— */
  /** .subs-block{margin:18px 0 6px} */
  subsBlock: {
    marginTop: POD.subsMarginTop,
    marginBottom: POD.subsMarginBottom,
  },
  /** .subs-head{baseline / gap 8 / margin-bottom 10} */
  subsHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: POD.subsHeadGap,
    marginBottom: POD.subsHeadMarginBottom,
  },
  /** .subs-head b：15 / 900 / 字距 .2 ——**不是** .section-title(19px)，故本区不套 Section */
  subsHeadTitle: {
    flexShrink: 1,
    fontSize: POD.subsHeadTitleSize,
    fontWeight: FONT_WEIGHT.black,
    letterSpacing: LETTER_SPACING.tight,
  },
  /** .subs-head em：11 / text-3（标题右侧只剩这个数） */
  subsHeadCount: {
    flexShrink: 0,
    fontSize: POD.subsHeadCountSize,
  },
  /** .subs-wrap{position:relative;flex:none} + .subs-card{width:132} */
  subsWrap: {
    flexShrink: 0,
    width: POD.subsCardWidth,
  },
  /** .subs-card{width:132;text-align:left} */
  subsCard: {
    width: POD.subsCardWidth,
  },
  /** .sub-n：12.5 / 700 / margin-top 8 / 行高 1.4 / 两行截断 */
  subsName: {
    marginTop: POD.subsNameMarginTop,
    fontSize: POD.subsNameSize,
    lineHeight: POD.subsNameSize * POD.subsNameLineHeight,
    fontWeight: FONT_WEIGHT.bold,
  },
  /** .sub-l：10.5 / text-3 / margin-top 3 / 等宽数字 */
  subsLeft: {
    marginTop: POD.subsLabelMarginTop,
    fontSize: POD.subsLabelSize,
    fontVariant: ['tabular-nums'],
  },
  /** .subs-x：22 圆贴片，卡右上角内缩 6 */
  subsX: {
    position: 'absolute',
    top: POD.subsXOffset,
    right: POD.subsXOffset,
    zIndex: 2,
    width: POD.subsXSize,
    height: POD.subsXSize,
    borderRadius: POD.subsXSize / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** .subs-empty：card 底 + hairline 描边 + 11.5/行高1.6 的**色块**（与 EmptyTip 不同族） */
  subsEmpty: {
    paddingVertical: POD.subsEmptyPaddingY,
    paddingHorizontal: POD.subsEmptyPaddingX,
    borderRadius: POD.subsEmptyRadius,
    borderWidth: 1,
  },
  subsEmptyText: {
    fontSize: POD.subsEmptyFontSize,
    lineHeight: POD.subsEmptyFontSize * POD.subsEmptyLineHeight,
  },

  /* —— .pod-region（home.css L49-L51）—— */
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: POD.regionGap,
    marginTop: POD.regionMarginTop,
    marginBottom: POD.regionMarginBottom,
  },
  /** .pod-region b：15 / 900 */
  regionNow: {
    flexShrink: 1,
    fontSize: POD.regionTitleSize,
    fontWeight: FONT_WEIGHT.black,
  },
  /** 右边那颗是跨件原子 .section-more（_base.css L120-L126）：屏内内联，不另抽件 */
  regionMore: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: CONTROL.moreGap,
  },
  regionMoreText: {
    fontSize: FONT_SIZE.smallLg,
  },
  regionMoreIcon: {
    opacity: CONTROL.moreIconOpacity,
  },
})
