import { useCallback, useMemo } from 'react'
import { StyleSheet, View, type ListRenderItem } from 'react-native'

import type { ListInfoItem } from '@/store/songlist/state'

// 直连 entry 而非 '@/newui/navigation' 桶口：避免 navigation/index → register → screens → 本文件的循环引用
import { pushNewUiPlayer, pushNewUiRadioHome, pushNewUiSonglistDetail } from '@/newui/navigation/entry'

import {
  ArtistCard,
  Banner,
  ChipRow,
  DailyCard,
  EmptyTip,
  FootNote,
  GhostButton,
  HScroll,
  PageListView,
  PlCard,
  QuickRow,
  RecentCard,
  Section,
  SectionNote,
  SongRow,
} from '@/newui/components'
import {
  NEW_UI_HOME_ARTISTS_NOTE,
  NEW_UI_HOME_ART_SEED,
  NEW_UI_HOME_BANNER_KEYS,
  NEW_UI_HOME_DAILY_KICKER,
  NEW_UI_HOME_EMPTY,
  NEW_UI_HOME_LIMITS,
  NEW_UI_HOME_MORES,
  NEW_UI_HOME_PLAY_TOAST,
  NEW_UI_HOME_QUICK_ITEMS,
  NEW_UI_HOME_QUICK_KEYS,
  NEW_UI_HOME_TITLES,
  NEW_UI_RECENT_CLEARED_TOAST,
  NEW_UI_HOME_TODO_TOAST,
  NEW_UI_SEARCH_UNPLAYABLE_TOAST,
} from '@/newui/const'
import type { NewUiPageProps } from '../../types'
import {
  useApiSupport,
  useDailyRecommend,
  useGridItemWidth,
  useHomeBanners,
  useHomeRanks,
  useNowPlaying,
  useRecommendPlaylists,
  useRecentPlays,
  useSingerPics,
  useWideLayout,
} from '@/newui/hooks'
import { CARD_GRID, PLATFORM_TINTS, SONG_ROW, type PlatformTintKey } from '@/newui/theme'
import { usePodEpisodeLive } from '@/newui/podcast'
import { clearNewUiRecentPlays, getSingerMidOfSong, getToday, playQueue, showNewUiToast, toSongDisplay } from '@/newui/utils'

/** 上屏上限（原型刻意设计值，集中在 const/home 的 NEW_UI_HOME_LIMITS，含各处原型行号） */
const RECENT_LIMIT = NEW_UI_HOME_LIMITS.recent
const ARTIST_LIMIT = NEW_UI_HOME_LIMITS.artists

/**
 * 推荐歌单网格的一「行」：最多「当前宽屏档的列数」张卡（竖屏 = CARD_GRID.columns 的 2）。
 * 虚拟化以**行**为回收单元（与歌单页 PoolRow 同款形态）；
 * 两页各留一份本地定义与渲染（字段命名空间不同：artSeed 前缀、点卡落的 fromTab 不同），
 * 第三处再出现时抽共通件（见本轮交付报告「遗留」）。
 */
interface PoolRow {
  key: string
  items: ListInfoItem[]
}

/** 首页「热门歌手」的一条：名字 + 可用于取真人头像的歌手 id（null = 这个平台没给出歌手 id） */
interface ArtistEntry {
  name: string
  /** 只可能是「这首歌的第一位署名歌手」——SDK 侧只带得出 singer[0] 的 id（tx） */
  mid: string | null
}

/**
 * 从「歌手名」拆出可能的多位歌手。分隔符两家：网易/酷我等用「/」，QQ 用「、」
 * （`utils/musicSdk/utils.js` formatSingerName 默认 join='、'），两种都得拆，
 * 否则合唱曲目会被当成一位「A、B」歌手，既不像人也对不上头像。
 */
const splitSingers = (singer: string): string[] =>
  singer.split(/[\/、]/).map(s => s.trim()).filter(s => s.length > 0)

/**
 * 首页（原型 #page-home）容器：只做「取真实数据 + 分派动作」，视觉全部交给共通组件。
 * 数据来源：轮播 = 当前音源与在放曲目；继续收听 = 新 UI 自记的收听历史
 * （useRecentPlays → utils/recentPlay，与「我的」页最近播放同一份；播核心 playedList
 * 只是随机模式去重池、换列表即清空，非随机恒空，2026-10-12 走查后换掉）；
 * 每日推荐 = 听过 + 我喜欢的推算；推荐歌单 = core/songlist；热门单曲 = core/leaderboard
 * （推荐歌单与热门单曲跟随音源浮层选定的内容平台，见 hooks/useContentPlatform）；
 * 热门歌手 = 从当前榜单曲目认人，头像复用同一批曲目带出的歌手 id（hooks/useSingerPics
 * → utils/singerPic，只有 tx 源给得出真人照，其余平台如实回落示意插画）。
 *
 * —— 2026-10-16 真机 OOM 修复轮（第 2 站点）：推荐池改「整页虚拟化列表」——
 * 旧形态是主屏共用 PageViewport（裸 ScrollView）里整页 `.map` 直出。首页各段落里，
 * 只有推荐歌单池（`playlists.items.map`）的条目数由平台侧给多少决定，其余（继续收听 12 /
 * 榜单歌 10 / 歌手 8）都是写死的上限。**如实说明**：当前 useRecommendPlaylists
 * 一次取一批再 slice(0, 4)，所以首页今天的上屏量是有限的（本轮改的是形态，不是止血数字）；
 * 但这段落与歌单页那条根因链同一条——一旦换成随触底累加的取数（每批 10 份那种），
 * 裸 ScrollView 就会让挂载视图数与池长成正比，Yoga 节点撑满 Java 堆 → OOM 栈顶 YogaNodeJNIBase。
 * 现本页自带 PageListView（FlatList）作主滚动容器，**卡池按两列成行为虚拟单元**，
 * 挂载数 = 屏内行 + windowSize 余量，与池长解耦；页头（轮播 / 快捷四格 / 继续收听 /
 * 每日推荐 / 池子标题行）进 ListHeaderComponent，热门单曲（就地换榜的整块）/ 热门歌手 /
 * 页脚进 ListFooterComponent——RN VirtualizedList 源码里 header/footer 两个 cell
 * 是无条件渲染的（不参与 windowing），所以这两块**永不回收、永不重挂**：
 * ① 轮播的 4.2s 自动换播定时器与横滑停靠位不会因滚动被重置（与旧 ScrollView 行为逐字一致，
 *    且横滑 ScrollView 嵌在纵滚列表里本就是改造前「纵向 ScrollView > 横向 ScrollView」的同款嵌套，
 *    手势关系没变）；
 * ② 榜单 tab 就地换榜要的「整块重渲染不被拆散」天然成立（整块就在一个 footer 里）。
 * 顶栏 pinned / 逐帧偏移经 onViewport* props 直回主屏（与歌单页同一条链路，
 * 见 MainScreen 的自带滚动容器分支）；首页**没有**触底续取链路，故不传 onEndReached，
 * 也不再经主屏 PageViewport 的 emitPageEndReached 总线（总线唯一的订阅方是排行榜页，
 * 首页滚到底从来没人接，撤掉这条空转不影响任何行为）。
 * 各区块顺序、间距、视觉与原型 #page-home 一致；数据语义（取几条、上限、点谁播什么）一字未动。
 * **不加 removeClippedSubviews**——回收单元里的 SVG 封面在 Android 有整格变白的老毛病
 * （SearchResultPanel 2026-10-12 同款结论，PageListView 注释亦同）。
 * 2026-10-15（拆件转正轮）：`.section-note` 原内联单元转正为独立组件 SectionNote，渲染零变化、文案常量原样。
 * 电台接线轮：撤掉页尾「随手听」区块（原型 index.html L684 明写首页电台**只剩快捷那一格**，
 * U33 两张 RadioCard 已退役——快捷格进 U81 电台首页的动线本就在上面 handleQuickPress 里，不动）。
 */
export const HomePage = ({
  componentId,
  onSwitchTab,
  onOpenSourceSheet,
  onViewportPinnedChange,
  onViewportScrollOffset,
  viewportTopInset = 0,
  viewportBottomInset = 0,
}: NewUiPageProps) => {
  const banners = useHomeBanners()
  const recentPlays = useRecentPlays()
  const daily = useDailyRecommend()
  const playlists = useRecommendPlaylists(4)
  const ranks = useHomeRanks()
  const nowPlaying = useNowPlaying()
  const assertApiSupport = useApiSupport()
  // 播放位里此刻是一集播客吗（原型 `epLive()`）：只订阅「是 / 不是」这一个结论，
  // 不跟着单集每秒的进度走——首页这么重，不能每秒重铺一遍（判据与订阅见 podcast/usePodEpisodeLive）
  const podEpisodeLive = usePodEpisodeLive()

  /**
   * 「暂停中 · <歌名>」那张横幅（原型 bannerItems 里的 now-playing 一条，app.js L186）在**单集在播时整条收起**
   * （2026-10-28 用户拍板）：单集的封面 / 集名 / 进度已经在迷你条上了，同一屏再摆一张「暂停中 · 那首歌」
   * 只会让人以为歌还在播。**不给它做单集形态**——用户选的就是「隐藏」。
   * 歌曲恢复（单集让出播放位）时那一张照旧出现，「音源公告」这条一直在。
   */
  const visibleBanners = useMemo(
    () => (podEpisodeLive
      ? banners.filter(item => item.key !== NEW_UI_HOME_BANNER_KEYS.nowPlaying)
      : banners),
    [banners, podEpisodeLive],
  )

  const cardWidth = useGridItemWidth()
  // 宽屏档的列数与栅格间隙（与 cardWidth 同一档，见 useWideLayout）：行切块用列数，不用写死的 2；
  // 间隙 medium 16×14 / expanded 16×12（原型 styles.css:1318-1319），竖屏档就是 CARD_GRID 的 14×12
  const { columns: gridColumns, rowGap: gridRowGap, columnGap: gridColumnGap } = useWideLayout()
  // 行样式缓存成稳定引用（与模块级 styles.row/rowGap 同一条「别每行每次渲染现造对象让 PlCard 的 memo 失效」口径）
  const poolRowStyle = useMemo(() => ({ gap: gridColumnGap ?? CARD_GRID.columnGap }), [gridColumnGap])
  const poolRowGapStyle = useMemo(() => ({ marginTop: gridRowGap ?? CARD_GRID.rowGap }), [gridRowGap])

  // 历史已在记录侧按曲去重（新播在前），这里只截上屏数量
  const recentSongs = useMemo(
    () => recentPlays.slice(0, RECENT_LIMIT),
    [recentPlays],
  )

  // 歌手不再另取接口：从当前榜单的曲目里认人，点谁就播这个榜里他的歌。
  // 头像顺同一批曲目带出：只有 tx（QQ）的 SDK 会把首位歌手 id 归一化进 meta.singerMid，
  // 且只对「第一位署名歌手」成立（合唱的第二位往后拿不到），其余平台 mid 恒为 null → 示意插画占位。
  const artists = useMemo<ArtistEntry[]>(() => {
    const picked: ArtistEntry[] = []
    for (const song of ranks.songs) {
      const names = splitSingers(song.singer)
      if (names.length === 0) continue
      const mid = getSingerMidOfSong(song)
      for (const name of names) {
        // mid 属于这首歌的第一位歌手，别的名字不能冒领（拿别人的脸更假）
        const entry = { name, mid: name === names[0] ? mid : null }
        const existed = picked.find(a => a.name === name)
        // 同名已在排内：之前只当过合唱的第二位（没拿到图），这次以首位身份出现就补上 mid
        if (existed != null) {
          if (existed.mid == null && entry.mid != null) existed.mid = entry.mid
          continue
        }
        picked.push(entry)
        if (picked.length >= ARTIST_LIMIT) return picked
      }
    }
    return picked
  }, [ranks.songs])

  // 待探测的歌手 id（去重；同一位歌手只发一次 HEAD，结果模块级缓存跨进页复用）
  const singerMids = useMemo(() => {
    const mids: string[] = []
    for (const artist of artists) {
      if (artist.mid == null || mids.includes(artist.mid)) continue
      mids.push(artist.mid)
    }
    return mids
  }, [artists])
  const { pics: singerPics, pending: singerPicsPending } = useSingerPics(singerMids)
  // 真人照片就绪的才带 artUri；没 mid / 探不到的交给 Art 的「无真图铺种子纹理」降级（组件零改动）
  const artistCards = useMemo(
    () => artists.map(artist => ({
      ...artist,
      artUri: artist.mid != null ? singerPics[artist.mid] ?? null : null,
    })),
    [artists, singerPics],
  )
  // 「平台未提供歌手照片」这句结论只在整排都是占位时说；探测未定期间不下断言，免得刚进页就被真图打脸
  const artistsAllPlaceholder = !artistCards.some(card => card.artUri != null) && !singerPicsPending

  const playableRankSongs = useMemo(
    () => ranks.songs.filter(song => assertApiSupport(song.source)),
    [assertApiSupport, ranks.songs],
  )

  // 轮播两条动线（原型 app.js L128-131）：正在播放 → 播放页；「音源公告」卡 → 开音源设置浮层（9d 接通）
  const handleBannerPress = useCallback((key: string) => {
    switch (key) {
      case NEW_UI_HOME_BANNER_KEYS.nowPlaying:
        pushNewUiPlayer(componentId)
        break
      default:
        onOpenSourceSheet?.()
    }
  }, [componentId, onOpenSourceSheet])

  const playDaily = useCallback(() => {
    if (!daily.songs.length) {
      showNewUiToast(NEW_UI_HOME_EMPTY.recent)
      return
    }
    void playQueue(`${NEW_UI_HOME_ART_SEED.daily}`, daily.songs, 0).then(ok => {
      if (ok) showNewUiToast(NEW_UI_HOME_PLAY_TOAST.daily)
    })
  }, [daily.songs])

  // 快捷四格（原型 QUICK）：电台那一格进 U81 电台首页，转场归 entry.ts
  const handleQuickPress = useCallback((key: string) => {
    switch (key) {
      case NEW_UI_HOME_QUICK_KEYS.daily:
        playDaily()
        break
      case NEW_UI_HOME_QUICK_KEYS.chart:
        onSwitchTab('rank')
        break
      case NEW_UI_HOME_QUICK_KEYS.liked:
        onSwitchTab('mine')
        break
      case NEW_UI_HOME_QUICK_KEYS.radio:
        pushNewUiRadioHome(componentId)
        break
    }
  }, [componentId, onSwitchTab, playDaily])

  const handleRecentPress = useCallback((index: number) => {
    void playQueue('played', recentSongs, index)
  }, [recentSongs])

  const handleRecentClear = useCallback(() => {
    // 清的是本页展示的那份历史（与「我的」页同一存储）；旧实现清 playedList 是随机池，与展示内容对不上
    clearNewUiRecentPlays()
    // QA 2026-10-14 D-11：清完无声无息等于假动作——与「我的」页同款 toast（原型两处入口共用一条实现）
    showNewUiToast(NEW_UI_RECENT_CLEARED_TOAST)
  }, [])

  // 歌单卡 → 新 UI 歌单详情层（阶段 9c 换线；旧详情页保留未动）。
  // fromTab='home'（QA D-16）：详情返回时落回本页
  const handlePlaylistPress = useCallback((info: ListInfoItem) => {
    pushNewUiSonglistDetail(componentId, info, 'pl', 'home')
  }, [componentId])

  // —— 推荐歌单池：虚拟单元 = 一行「当前档列数」张卡（竖屏就是 .pl-grid 的 1fr 1fr 两列）——
  // 池子只整批替换（useRecommendPlaylists 一次取一批并 slice 到 limit），行 key 用成员 id 拼接，
  // 换平台/换分类时整批换 key、行内容跟着换，不会把旧行的封面留在新行上
  // 列数吃 useWideLayout（与 useGridItemWidth 的默认列数同源）：横屏 / 平板一档每行 3 或 4 张，
  // 竖屏 (<600) 恒等于 CARD_GRID.columns，分档前后逐值一致
  const poolRows = useMemo<PoolRow[]>(() => {
    const out: PoolRow[] = []
    for (let i = 0; i < playlists.items.length; i += gridColumns) {
      const slice = playlists.items.slice(i, i + gridColumns)
      out.push({ key: slice.map(item => `${item.source}-${item.id}`).join('|'), items: slice })
    }
    return out
  }, [playlists.items, gridColumns])

  // 池子自身的空态/错误文案（口径与改造前 Section 体内三分支逐字一致：
  // 错误 → 报错误原文；有条目 → 不显示（卡行接管）；没条目 → 正在取的一句话。
  // 位置从「Section 体」挪到标题行之下、卡行应在之处（列表头尾部），前后顺序不变）
  const poolTip = playlists.error
    ? playlists.error
    : poolRows.length
      ? null
      : NEW_UI_HOME_EMPTY.loading

  const poolKeyExtractor = useCallback((row: PoolRow) => row.key, [])

  // 一行「当前档列数」张卡（竖屏两卡）：列间隙 .pl-grid 的 12（gap 列向），行向 14 由第二行起的首 margin 承担——
  // 与旧 CardGrid（flexWrap + rowGap/columnGap）逐像素等价，也与歌单页虚拟化后的行口径相同
  const renderPoolRow = useCallback<ListRenderItem<PoolRow>>(({ item, index }) => (
    <View style={[styles.row, poolRowStyle, index > 0 ? poolRowGapStyle : null]}>
      {item.items.map(pl => (
        <PlCard
          key={`${pl.source}-${pl.id}`}
          width={cardWidth}
          title={pl.name}
          artSeed={`${NEW_UI_HOME_ART_SEED.playlist}:${pl.id}`}
          artUri={pl.img ?? undefined}
          meta={
            // meta 口径按原型 app.js L343「播放数 · N/M 首可播」（QA D15）：可播数按当前音源对
            // 该平台的覆盖如实判定——整家没接上就是 0/M，接上了就是 M/M；真实侧此刻还没有逐首
            // 取曲目，不伪造逐首数
            [pl.play_count, pl.total
              ? `${assertApiSupport(pl.source) ? pl.total : 0}/${pl.total} 首可播`
              : null]
              .filter(Boolean)
              .join(' · ')
          }
          tint={/* QA 2026-10-14 D-14：原型 .pl-card .ps 恒有 .src-dot（app.js L341-343），项目口径换平台 tint 上色（与歌单页池子卡/我的页同款） */
            PLATFORM_TINTS[pl.source as PlatformTintKey]}
          onPress={() => handlePlaylistPress(pl)}
        />
      ))}
    </View>
  ), [assertApiSupport, cardWidth, handlePlaylistPress, poolRowGapStyle, poolRowStyle])

  const handleSongPress = useCallback((song: LX.Music.MusicInfoOnline) => {
    if (!assertApiSupport(song.source)) {
      // 不可播提示走共通键（原型 app.js L458 同一句，QA D10：此处原本硬编码自造句）
      showNewUiToast(NEW_UI_SEARCH_UNPLAYABLE_TOAST)
      return
    }
    void playQueue(ranks.activeId, ranks.songs, ranks.songs.indexOf(song))
  }, [assertApiSupport, ranks.activeId, ranks.songs])

  const handlePlayAll = useCallback(() => {
    if (!playableRankSongs.length) {
      showNewUiToast(NEW_UI_HOME_PLAY_TOAST.nothingPlayable)
      return
    }
    void playQueue(ranks.activeId, playableRankSongs, 0)
  }, [playableRankSongs, ranks.activeId])

  const handleArtistPress = useCallback((name: string) => {
    const songs = ranks.songs.filter(song => song.singer.includes(name))
    if (!songs.length) {
      showNewUiToast(NEW_UI_HOME_TODO_TOAST.artists)
      return
    }
    void playQueue(`${ranks.activeId}__${name}`, songs, 0)
  }, [ranks.activeId, ranks.songs])

  const today = getToday()

  // —— 列表头（ListHeaderComponent）：轮播 + 快捷四格 + 继续收听 + 每日推荐 + 池子标题行 ——
  // 全是定长内容（轮播最多 2 条、快捷 4 格、继续收听上限 12、榜单/池子各有上限），
  // 且 VirtualizedList 的 header cell 不参与 windowing：轮播的自动换播定时器与横滑停靠位
  // 不会因滚动被重置，与改造前的裸 ScrollView 行为逐字一致；横滑 ScrollView 嵌在纵滚列表内
  // 也是改造前就存在的同款嵌套（纵向 ScrollView > 横向 ScrollView），手势关系没变。
  const listHeader = (
    <View>
      <Banner items={visibleBanners} onPress={handleBannerPress} />

      <QuickRow items={NEW_UI_HOME_QUICK_ITEMS} onPress={handleQuickPress} />

      <Section
        title={NEW_UI_HOME_TITLES.recent}
        more={recentSongs.length ? NEW_UI_HOME_MORES.recent : undefined}
        onMorePress={handleRecentClear}
      >
        {recentSongs.length
          ? (
            <HScroll>
              {recentSongs.map((song, index) => {
                const display = toSongDisplay(song, assertApiSupport(song.source))
                return (
                  <RecentCard
                    key={song.id}
                    title={display.title}
                    // 原型 .rs 只给歌手（app.js L277），专辑不进卡片；字段统一走 toSongDisplay
                    subtitle={display.artist}
                    artSeed={display.artSeed}
                    artUri={display.artUri}
                    onPress={() => handleRecentPress(index)}
                  />
                )
              })}
            </HScroll>
          )
          : <EmptyTip text={NEW_UI_HOME_EMPTY.recent} />}
      </Section>

      {/* QA 2026-10-14 首页 D-04：原型每日推荐区块没有页头大标题（index.html L122 直接铺 .daily-card），
          卡内 kicker+标题已自带身份；Section 不传 title 即整行不渲染（组件注释同款约定） */}
      <Section>
        <DailyCard
          kicker={NEW_UI_HOME_DAILY_KICKER}
          title={NEW_UI_HOME_TITLES.daily}
          sub={daily.sub}
          date={today.label}
          artSeed={`${NEW_UI_HOME_ART_SEED.daily}:${today.key}`}
          onPress={playDaily}
        />
      </Section>

      {/* 池子标题行（Section 不传 children：只出头，卡行由列表体承载）——
          root margin-top 26 + head margin-bottom 12 与旧「Section 头 + CardGrid 体」逐字同间距，
          与歌单页虚拟化后用的是同一套口径 */}
      <Section
        title={NEW_UI_HOME_TITLES.playlists}
        more={NEW_UI_HOME_MORES.playlists}
        onMorePress={() => onSwitchTab('playlist')}
      />
      {poolTip ? <EmptyTip text={poolTip} /> : null}
    </View>
  )

  // —— 列表尾（ListFooterComponent）：热门单曲 + 热门歌手 + 页脚 ——
  // 两块都是定长（榜单歌 10 首 / 歌手 8 位），不为它们做「虚拟化而虚拟化」：
  // footer cell 与 header 一样永不回收，正合「点榜单 tab 就地换榜要整块重渲染、不被拆散」的要求
  // （换榜后 ChipRow 选中态 + song-list 整体重建都在同一个块内完成，与改造前一模一样）。
  const listFooter = (
    <View>
      <Section
        title={NEW_UI_HOME_TITLES.songs}
        more={NEW_UI_HOME_MORES.songs}
        onMorePress={() => onSwitchTab('rank')}
      >
        {ranks.tabs.length > 0 && (
          <ChipRow
            items={ranks.tabs.map(tab => ({ key: tab.id, label: tab.name }))}
            activeKey={ranks.activeId}
            onSelect={ranks.selectTab}
          />
        )}
        {ranks.error
          ? <EmptyTip text={ranks.error} />
          : ranks.songs.length
            ? (
              <View style={styles.songList}>
                {ranks.songs.map((song, index) => {
                  const playable = assertApiSupport(song.source)
                  const display = toSongDisplay(song, playable)
                  const active = nowPlaying.id === song.id
                  return (
                    <SongRow
                      key={song.id}
                      rank={index + 1}
                      artSeed={display.artSeed}
                      artUri={display.artUri}
                      // 榜单明细没带逐曲封面时（酷我），行内共通补图（2026-10-12 走查现象 1）
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
                      onPress={() => handleSongPress(song)}
                    />
                  )
                })}
              </View>
            )
            : <EmptyTip text={NEW_UI_HOME_EMPTY.loading} />}
        {/* 「播放全部」恒渲染（原型 renderSongs app.js L411-413：空列表也照旧重绘「播放全部 0 首」，
            按下给「这几首在当前音源下不可播…」），QA D01 撤掉此前多写的 ranks.songs.length > 0 条件 */}
        <GhostButton
          icon="play"
          label={`播放全部 ${playableRankSongs.length} 首`}
          onPress={handlePlayAll}
          style={styles.playAll}
        />
      </Section>

      {artists.length > 0 && (
        <Section title={NEW_UI_HOME_TITLES.artists}>
          {/* 头像优先用平台官方歌手照（tx 曲目带 singerMid → utils/singerPic 探到图）；
              拿不到时才回落种子渐变 + 示意插画，此时才如实说明「平台未提供歌手照片」，
              有真图的排面不再挂这句（2026-10-15 方案 B）。原「更多」无落地页已撤下 */}
          {artistsAllPlaceholder && <SectionNote text={NEW_UI_HOME_ARTISTS_NOTE} />}
          <HScroll>
            {artistCards.map(card => (
              <ArtistCard
                key={card.name}
                name={card.name}
                artSeed={`${NEW_UI_HOME_ART_SEED.artist}:${card.name}`}
                artUri={card.artUri ?? undefined}
                onPress={() => handleArtistPress(card.name)}
              />
            ))}
          </HScroll>
        </Section>
      )}

      <FootNote text="曲库内容来自各平台 · 能否播放取决于当前音源" />
    </View>
  )

  return (
    <PageListView
      data={poolRows}
      renderItem={renderPoolRow}
      keyExtractor={poolKeyExtractor}
      headerComponent={listHeader}
      footerComponent={listFooter}
      topInset={viewportTopInset}
      bottomInset={viewportBottomInset}
      // 吸顶链路换滚动源的接回（2026-10-16，与歌单页同一条）：顶栏 pinned 与逐帧偏移直发主屏，
      // 计量在 useViewportScroll，与其余三页经 PageViewport 的口径逐字相同。
      // 首页没有分类条吸顶，主屏 handleScrollOffset 拿到偏移时因未上报触发线（catLineRef=null）
      // 而空转，歌单页那条链路不受影响（两页从不同时挂载，主屏切 Tab 时已把 catLineRef 复位）
      onPinnedChange={onViewportPinnedChange}
      onScrollOffset={onViewportScrollOffset}
    />
  )
}

const styles = StyleSheet.create({
  /** .pl-grid 的一行：横排本体（列间隙与行间隙按宽屏档在渲染期给，见 poolRowStyle / poolRowGapStyle） */
  row: {
    flexDirection: 'row',
  },
  /** .song-list：竖向排布，行间距 2px */
  songList: {
    gap: SONG_ROW.listGap,
  },
  /** .ghost-btn 在区块尾部留一段距离（原型 margin-top:12px） */
  playAll: {
    marginTop: 12,
  },
})
