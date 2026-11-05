import { useCallback, useEffect, useMemo } from 'react'
import { BackHandler, FlatList, StyleSheet, Text, View } from 'react-native'
import { Navigation } from 'react-native-navigation'

import { LIST_LOAD_LIMIT } from '@/core/songlist'

import { pickArtPalette } from '@/newui/components/Art'
import { CoverWash } from '@/newui/components/CoverWash'
import { EmptyTip } from '@/newui/components/EmptyTip'
import { GhostButton } from '@/newui/components/GhostButton'
import { MinibarHost } from '@/newui/components/Minibar'
import { PagingEnd } from '@/newui/components/PagingEnd'
import { PagingStatus } from '@/newui/components/PagingStatus'
import { PlTop } from '@/newui/components/PlTop'
import { NEW_UI_PAGING_END_TEXT } from '@/newui/const/app'
import { newUiPodArtSeed } from '@/newui/const/radio'
import {
  NEW_UI_POD_DETAIL_LABELS,
  NEW_UI_POD_DETAIL_STATUS,
  NEW_UI_POD_DETAIL_TXT,
  NEW_UI_POD_RESUME_MIN_LEFT_SEC,
} from '@/newui/const/radioDetail'
import { useNewUiSystemBar, useSafeArea, useWideLayout } from '@/newui/hooks'
// 直连 entry 而非 '@/newui/navigation' 桶口：避免 navigation/index → register → screens → 本文件的循环引用
import { pushNewUiEpisode } from '@/newui/navigation/entry'
import {
  addPodSub,
  type PodEpisodeRow,
  podDateText,
  podDurationText,
  usePodcastDetail,
  usePodProgress,
} from '@/newui/podcast'
import {
  FONT_WEIGHT,
  LETTER_SPACING,
  PL_LAYER,
  POD,
  Z_LAYER,
  useTheme,
} from '@/newui/theme'

import { EpisodeRow } from './EpisodeRow'
import { PodcastHero } from './PodcastHero'

/**
 * U81 榜行 / U83 命中行带过来的节目快照（契约 7.3④：RNN 走原生桥，passProps 只能可序列化 plain object）。
 * 只给这五项——本屏自己发 ③ 取详情（对撞 7.3④「U82 拿到后自行查详情接口」）。
 */
export interface NewUiPodcastDetailPassShow {
  id: string
  name: string
  by: string
  tags: string[]
  artworkUrl: string
}

export interface PodcastDetailScreenProps {
  componentId: string
  show: NewUiPodcastDetailPassShow
}

/**
 * 播客详情层（原型 `#podcastLayer`，`new_design/parts/radio/detail.{html,css}`，U82）。
 * 全屏右推屏，转场与歌单详情层同一条 `.pl-layer` 规则（时长 `PL_LAYER.enterDuration`）。
 *
 * **结构（本轮用户钉死：单集以上全部固定，只有单集列表滚）**——件头逐字「外层 `#podcastLayer{padding:0;overflow:hidden}`
 * → 固定段 `.pl-head`（本屏装顶排 + `.pl-hero` + `.pl-actions` + `.ep-head`）→ 滚动段**就是 `.ep-list` 自己**」：
 * - 钉住段（`View{flex:none}`，含状态栏预留 `PL_LAYER.paddingTopReserve`，判例 `SonglistDetailScreen.tsx:608-612`）：
 *   顶排 `PlTop` + `PodcastHero` + 那颗「继续播放 / 播最新单集」+「单集」小标题；
 * - 轴（`FlatList{flex:1}`）：**只有 `.ep-row`** + 尾巴那一行收行（`PagingEnd`，见 `axisFooter`），
 *   `contentContainerStyle` 走 `#podcastLayer>.ep-list{padding:6px 16px 34px}`。
 *
 * **单集列不分页、不触底、没有「加载更多」**（件头：接口给多少集就列多少集；③ 的 `entity` 不支持 offset，
 * 一批给回的就是全部）。但**仍然虚拟化**：一次 50 条带摘要的行足够压垮挂载数（用户整轮要求）。
 * 选型按对撞 7.5 的拍板走 `FlatList`（不引入 FlashList、不用 `PageListView`、不开 `removeClippedSubviews`）。
 * 尾巴仍按原型收一行「没有更多了」（app.js L2246-L2251，todo-list 第 2 条补齐）：不分页不等于不收行，
 * 滚到底要能确认「最近这些就是全部」。
 */
export const PodcastDetailScreen = ({ componentId, show }: PodcastDetailScreenProps) => {
  const theme = useTheme()
  const { top, bottom } = useSafeArea()
  const { wide, layerPaddingX } = useWideLayout()
  useNewUiSystemBar(componentId)

  const showId = show.id
  const detail = usePodcastDetail(showId)
  const progress = usePodProgress()
  const episodes = detail.episodes

  /**
   * 「我听的」自动登记（本轮用户定口径，**维持现状不动**）：**打开过某节目的详情页就算听过它**，
   * 不改成「只记真播过的单集」——那要用户另下指令。
   * 原型把 #podSubBtn 撤了（件头逐字），屏上没有手动「收进这台设备」的入口；RN 侧「听过」的可观测点
   * 就是进这一屏——于是进层即拿上层带来的快照收进本机名单，详情取回后再用接口侧节目本体刷新一次
   * （接口 ③ 的封面是 600 档、名字与作者以接口为准）。
   * 顺序语义交给数据层 `addPodSub` 的既有实现：新收录的排最前；同 id 再进**只原地刷新快照、
   * 不重复登记、不打乱顺序**——与原型 `#radioSub` 按 `LS.podSub` 数组序渲染、`unsubPod` 只删不移的
   * 口径一致（原型 app.js L1815 / L1844-1847），不自创规则。
   */
  useEffect(() => {
    addPodSub({ id: show.id, name: show.name, by: show.by, artworkUrl: show.artworkUrl })
  }, [show.id, show.name, show.by, show.artworkUrl])
  useEffect(() => {
    const fetched = detail.show
    if (fetched != null) {
      addPodSub({ id: fetched.id, name: fetched.name, by: fetched.by, artworkUrl: fetched.artworkUrl })
    }
  }, [detail.show])

  // 封面种子（原型 coverArt('pod:' + show.id)）：hero、`.pl-bg` 底纹、单集屏头图三处同源
  const artSeed = useMemo(() => newUiPodArtSeed(showId), [showId])
  const [bgC1, bgC2] = useMemo(() => pickArtPalette(artSeed), [artSeed])

  /**
   * 轴内留白：`#podcastLayer>.ep-list{padding:6px 16px 34px}`，34 那一档再吃掉底部安全区
   * （写法与缓存理由照判例 SonglistDetailScreen.tsx:607-612：安全区/内距是稳定值，缓存后不触发整块重布局）。
   * 左右换成 620 居中轴那根算式（`.wide #podcastLayer>.ep-list{padding-left/right:max(16px,calc((100% - 620px)/2))}`，
   * styles.css:1340）；上下两位（6 / 34）这一档原型不动。
   */
  const axisContent = useMemo(() => ({
    ...styles.axisContentBase,
    paddingHorizontal: layerPaddingX ?? POD.epAxisPaddingX,
    paddingBottom: POD.epAxisPaddingBottom + bottom,
  }), [bottom, layerPaddingX])

  // 顶排 crumb 恒回显**节目名**（件头：长名字只截断，不再退回类别词）；先吃快照，详情回来后以接口为准
  const showName = detail.show?.name ?? show.name
  const showBy = detail.show?.by ?? show.by
  // hero 的分类词两枚（app.js L2008 `tags.slice(0, 2)`）。
  // 泛化词那枚已在数据层剔掉（用户拍板「剔掉 'Podcasts'」，见 `podcast/mappers.ts` 的 GENERIC_GENRE_NAME）；
  // 这里只按原型切片。剔完为空时 hero 那一栏整个不画（PodcastHero 自己判 length）。
  const heroTags = useMemo(
    () => (detail.show?.tags ?? show.tags).slice(0, 2),
    [detail.show?.tags, show.tags],
  )
  const artworkUrl = detail.show?.artworkUrl ?? show.artworkUrl

  // 「最新单集」取**首集日期**（③ 单集实测新集在前），节目侧那个会滞后一天、只作回落
  const latestDateText = useMemo(() => {
    const iso = episodes[0]?.date ?? detail.show?.updated
    return iso != null && iso.length > 0 ? podDateText(iso) : ''
  }, [episodes, detail.show?.updated])

  // 本机进度（「还剩 X」与那颗钮的两种状态都靠它，接口读不到也写不回）
  const progressEntry = progress.progressOf(showId)
  const progressEpisode =
    progressEntry != null ? episodes[progressEntry.idx] ?? null : null
  const canResume =
    progressEntry != null &&
    progressEpisode != null &&
    progressEntry.left > NEW_UI_POD_RESUME_MIN_LEFT_SEC
  // 那颗钮两种状态跳的是同一个屏，只是下标不同（app.js L2030 `openEpisode(canResume ? p.idx : 0)`）
  const actionIndex = canResume && progressEntry != null ? progressEntry.idx : 0

  const goBack = useCallback(() => {
    void Navigation.pop(componentId)
  }, [componentId])

  // 硬件返回键显式接管（判例 SonglistDetailScreen.tsx:388-397：交 RNN 默认 pop 在真机落位不稳）
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack()
      return true
    })
    return () => { subscription.remove() }
  }, [goBack])

  /**
   * 进单集屏（U84）。那一屏自己不发请求：节目名、封面与这一集的展示栏都由这里带过去
   * （passProps 全可序列化；③ 给的音频直链 `episodeUrl` 现在要真出声，所以也必须过桥）。
   *
   * `playNow`（用户 2026-10 拍板「点了就出声」）：只有上面那颗「继续播放 / 播最新单集」传 true，
   * 行点进去仍是老行为（只看不播）。真正的起播发生在单集屏——本屏没有 toast 宿主，
   * 定时停止播放那道闸的提示得落在单集屏头上（理由见 `EpisodeScreen` 的 autoPlay 注释）。
   */
  const openEpisode = useCallback((index: number, playNow = false) => {
    const episode = episodes[index]
    if (episode == null) return
    pushNewUiEpisode(componentId, {
      showId,
      showName,
      artworkUrl,
      episodeIndex: index,
      episode: {
        id: episode.id,
        title: episode.title,
        sec: episode.sec,
        dateText: episode.dateText,
        durationText: episode.durationText,
        intro: episode.intro,
        // 接口这集没给直链就是空串：单集屏据此让播放钮不做声（不猜地址、不编字段）
        episodeUrl: episode.episodeUrl ?? '',
      },
      ...(playNow ? { autoPlay: true } : {}),
    })
  }, [artworkUrl, componentId, episodes, showId, showName])

  const renderItem = useCallback(({ item, index }: { item: PodEpisodeRow, index: number }) => (
    <EpisodeRow
      title={item.title}
      dateText={item.dateText}
      durationText={item.durationText}
      intro={item.intro}
      // 进度 tag 只在「本机记的就是这一集」时出现（epRow L2058 `p.idx === i`）
      leftText={
        progressEntry != null && progressEntry.idx === index
          ? NEW_UI_POD_DETAIL_TXT.left(podDurationText(progressEntry.left))
          : undefined
      }
      style={index > 0 ? styles.rowGap : undefined}
      onPress={() => { openEpisode(index) }}
    />
  ), [openEpisode, progressEntry])

  const keyExtractor = useCallback(
    // 单集 id ← trackId，理论上可能缺（映射成空串）；那种行退回下标，不让两行共用一个 key
    (item: PodEpisodeRow, index: number) => (item.id.length > 0 ? item.id : `ep-${index}`),
    [],
  )

  // —— 钉住段：顶排 + hero + 那颗钮 +「单集」小标题 ——
  // 宽屏档吃 `.wide .pl-head{padding:36px max(16px,calc((100% - 620px)/2)) 0}`（styles.css:1337），
  // compact 两侧都回竖屏基线（写法与 RadioHomeScreen 同一判据入口）
  const pinnedHead = (
    <View
      style={[
        styles.pinned,
        {
          paddingTop: top + (wide?.statusReserve ?? PL_LAYER.paddingTopReserve),
          paddingHorizontal: layerPaddingX ?? PL_LAYER.paddingX,
        },
      ]}
    >
      {/* 顶排右上空槽（kind:'none'）：件头明写「那颗收听（#podSubBtn）本轮撤了，这一屏只留 hero 那一颗」。
          「收进这台设备」改由进层自动登记（见上面「我听的」自动登记那两条 effect），屏上依旧不给手动钮。 */}
      <PlTop
        crumbText={showName}
        backLabel={NEW_UI_POD_DETAIL_LABELS.back}
        onBack={goBack}
        right={{ kind: 'none' }}
      />

      <PodcastHero
        artSeed={artSeed}
        artUri={artworkUrl}
        name={showName}
        by={showBy}
        tags={heroTags}
        countText={detail.show?.count != null ? NEW_UI_POD_DETAIL_TXT.count(detail.show.count) : undefined}
        latestText={latestDateText.length > 0 ? NEW_UI_POD_DETAIL_TXT.latest(latestDateText) : undefined}
        leftText={
          progressEntry != null && progressEpisode != null
            ? NEW_UI_POD_DETAIL_TXT.left(podDurationText(progressEntry.left))
            : undefined
        }
      />

      {/*
        .pl-actions：这一屏只有 hero 那一颗（`GhostButton` solid 档复用原子，单颗不构成重复单元，
        故不抽件、也不套 PlActions 那「播放全部 + 随机」两颗）。
        **两种状态同一颗钮**（app.js L2027-L2030）：听过 →「继续播放 · 还剩 X」，没听过 →「播最新单集 · X」。
        单集还没在手（首屏取数中 / 取失败）时不摆这颗钮：那时「播最新单集 · 0 分钟」是虚报。
        点它 = 进单集屏并**当场起播**（`openEpisode(actionIndex, true)`，用户 2026-10 拍板），
        不再让人进屏后还得再点一次播放钮。
      */}
      {episodes.length > 0 && (
        <View style={styles.actions}>
          <GhostButton
            icon="play"
            solid
            fill={false}
            style={styles.actionBtn}
            label={
              canResume && progressEntry != null
                ? NEW_UI_POD_DETAIL_TXT.resume(podDurationText(progressEntry.left))
                : NEW_UI_POD_DETAIL_TXT.playLatest(episodes[0].durationText)
            }
            onPress={() => { openEpisode(actionIndex, true) }}
          />
        </View>
      )}

      {/* 「单集」小标题在钉住段里、不进那根轴（件头：静态节点 #podEpHead 挂在 .pl-head） */}
      <View style={styles.epHead}>
        <Text style={[styles.epHeadText, { color: theme.colors.text }]}>
          {NEW_UI_POD_DETAIL_TXT.epHead}
        </Text>
      </View>
    </View>
  )

  // 取数中 / 取不到 / 一集都没有：轴里那一行状态提示（`.pl-status` 与 `.empty-tip` 两个原子复用）。
  // 三态互斥：`episodes` 为空才轮到这一块，所以「还在载入」「载入失败」「真没有单集」各自只有一句、
  // 不会两句话同时占屏（文案除 loading 外都是本屏自补的，原型 U82 吃同步 mock、根本没有这两态）。
  const axisEmpty = (
    <View>
      {detail.loading && <PagingStatus disabled loading text={NEW_UI_POD_DETAIL_STATUS.loading} />}
      {!detail.loading && detail.failed && (
        <PagingStatus text={NEW_UI_POD_DETAIL_STATUS.failed} onPress={detail.retry} />
      )}
      {/* 既不在载入、也没失败、单集就是空：这一句与上面「失败」那句分开说，
          不然用户会去点一个并不存在的重试 */}
      {!detail.loading && !detail.failed && (
        <EmptyTip text={NEW_UI_POD_DETAIL_STATUS.empty} variant="layer" />
      )}
    </View>
  )

  /**
   * 轴尾收行（原型 app.js L2246-L2251：`show.episodes.forEach(...)` 铺完之后
   * `list.appendChild(plEndRow())` —— 逐字「这一批取回的单集一次铺完（不分页），但列表尾照样收一行
   * 『没有更多了』：滚到底要能确认『最近这些就是全部』」）。
   *
   * **收行条件必须真实**（不许一进屏就写「没有更多了」）：这一屏没有分页、也没有「取完」的页码，
   * 「就这些」这个事实只在**这一批真的取回来**之后才成立。所以三档一起判：
   * - `episodes.length === 0` → 不摆（首屏取数中 / 取失败 / 真的一集都没有，三种都由轴内的
   *   `axisEmpty` 说话；这时收行会变成「对着空气说就这些」）；
   * - `detail.loading` → 不摆（重试会把 loading 抬起而 `episodes` 还留着上一批，此时收行是旧结论）；
   * - `detail.failed` → 不摆（失败态归状态行，收行与它不许同屏争同一句话）。
   * 三者都过了 = 接口这一批已经落在手里、且没有任何在途/失败，此时「没有更多了」才是真的。
   * 与状态行互斥（可见性条件与 `axisEmpty` 完全不相交），所以屏上永远只有一行尾巴（todo-list 第 2 条）。
   */
  const axisFooter = useMemo(() => {
    if (episodes.length === 0 || detail.loading || detail.failed) return null
    return <PagingEnd text={NEW_UI_PAGING_END_TEXT} />
  }, [detail.failed, detail.loading, episodes.length])

  return (
    <View
      nativeID="newui.podcast.content"
      style={[styles.root, { backgroundColor: theme.colors.bg }]}
    >
      {/* .pl-bg：`.pl-head` 与轴都标了 zIndex 压在它之上（判例 SonglistDetailScreen.tsx:711-715） */}
      <CoverWash
        colors={[bgC1, bgC2]}
        alpha={PL_LAYER.bgAlpha}
        heightRatio={PL_LAYER.bgHeightRatio}
      />

      {pinnedHead}

      <FlatList
        style={styles.axis}
        data={episodes}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={axisEmpty}
        ListFooterComponent={axisFooter}
        // 虚拟化参数照 SonglistDetailScreen LIST_LOAD_LIMIT=30 判例（本列不分页，所以没有
        // onEndReached；尾巴只有一行「没有更多了」收行，见 axisFooter）
        initialNumToRender={LIST_LOAD_LIMIT}
        maxToRenderPerBatch={14}
        windowSize={9}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={axisContent}
      />
      {/* 常驻迷你播放条：本层默认磁吸圆点（原型 miniPageSnapped：不在首页就是圆点）。
          挂在轴之后、屏幕根层最后——圆点浮在单集列表之上 */}
      <MinibarHost componentId={componentId} bottomInset={bottom} defaultSnapped />
    </View>
  )
}

PodcastDetailScreen.displayName = 'NewUIPodcastDetailScreen'

const styles = StyleSheet.create({
  /** 屏根：`#podcastLayer{padding:0;overflow:hidden}`（padding 下放到钉住段与轴各自身上） */
  root: {
    flex: 1,
  },
  /** .pl-head{flex:none;padding:58px 16px 0} → 58 = 实测状态栏 + PL_LAYER.paddingTopReserve；
   *  CSS 的 `flex:none` 在 RN 写作 `flex: 0`（不伸不缩，高度由内容定，把剩下的整块让给那根轴） */
  pinned: {
    flex: 0,
    paddingHorizontal: PL_LAYER.paddingX,
    zIndex: Z_LAYER.layerContent,
  },
  /** .pl-actions{display:flex;gap:8px;margin:18px 0 16px}（本屏只有一颗，占满整宽） */
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PL_LAYER.actionsGap,
    marginTop: PL_LAYER.actionsMarginTop,
    marginBottom: PL_LAYER.actionsMarginBottom,
  },
  /** .ep-head{display:flex;align-items:baseline;gap:8px;margin:22px 0 4px} */
  epHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: POD.epHeadGap,
    marginTop: POD.epHeadMarginTop,
    marginBottom: POD.epHeadMarginBottom,
  },
  /** .ep-head b{font-size:15px;font-weight:900;letter-spacing:.2px}；字色随 --text（原型无 color 规则），由容器给 */
  epHeadText: {
    fontSize: POD.epHeadTitleSize,
    fontWeight: FONT_WEIGHT.black,
    letterSpacing: LETTER_SPACING.tight,
  },
  /** .pl-actions .ghost-btn{flex:1}（本屏只有这一颗，flex 满档） */
  actionBtn: {
    flex: 1,
  },
  /** #podcastLayer>.ep-list{flex:1;overflow-y:auto;padding:6px 16px 34px} + .ep-list{margin-top:8px} */
  axis: {
    flex: 1,
    marginTop: POD.epListMarginTop,
    zIndex: Z_LAYER.layerContent,
  },
  /** 轴内留白：paddingBottom 还要吃掉底部安全区，故在渲染期算（见 axisContent） */
  axisContentBase: {
    paddingHorizontal: POD.epAxisPaddingX,
    paddingTop: POD.epAxisPaddingTop,
  },
  /** .ep-list{gap:1px}（模块级静态引用，避免每行每次渲染现造样式让 EpisodeRow 的 memo 失效） */
  rowGap: {
    marginTop: POD.epListGap,
  },
})
