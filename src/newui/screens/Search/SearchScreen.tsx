import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { Navigation } from 'react-native-navigation'

import { search as searchMusic } from '@/core/search/music'
import { search as searchSonglist } from '@/core/search/songlist'
import { getList as getHotSearchList } from '@/core/hotSearch'
import type { ListInfoItem } from '@/store/songlist/state'

// 直连 entry 而非 '@/newui/navigation' 桶口：避免 navigation/index → register → screens → 本文件的循环引用
import { pushNewUiSonglistDetail } from '@/newui/navigation/entry'

import { MinibarHost, NewUiToastHost, SearchTop } from '@/newui/components'
import { MoreSheet } from '@/newui/screens/Main/sheets'
import {
  NEW_UI_SEARCH_CANCEL,
  NEW_UI_SEARCH_HOT_LIMIT,
  NEW_UI_SEARCH_INPUT_PLACEHOLDER,
  NEW_UI_SEARCH_PL_INVALID_TOAST,
  NEW_UI_SEARCH_UNPLAYABLE_TOAST,
} from '@/newui/const'
import {
  useApiSupport,
  useNewUiSystemBar,
  useNowPlaying,
  useSafeArea,
  useWideLayout,
} from '@/newui/hooks'
import { SEARCH, useTheme } from '@/newui/theme'
import { normalizeSearchListInfoItem, playQueue, requestNewUiTab, showNewUiToast, toSongDisplay } from '@/newui/utils'

import { SearchIdlePanel } from './SearchIdlePanel'
import {
  clearSearchHistory,
  peekSearchHistory,
  readSearchHistory,
  rememberSearchWord,
} from './searchHistory'
import {
  SearchResultPanel,
  SearchTabs,
  type NewUiSearchTab,
  type SearchResultSong,
} from './SearchResultPanel'

export interface SearchScreenProps {
  componentId: string
}

/**
 * 搜索层（原型 #searchLayer，app.js L2331-2450 renderSearchIdle / renderSearch / openSearch，
 * styles.css L776-808）。
 * 全屏右推屏幕（转场见 navigation/entry.ts 的 pushNewUiSearch，复刻 .pl-layer 的 translateX 100%→0 / .44s）。
 * 数据全部走既有核心：core/search/music + core/search/songlist（'all' 合并搜索）、
 * core/hotSearch（热搜）；「搜过的词」走本目录 searchHistory.ts（读写 `@/utils/data` 同格存储，
 * 绕开 core/search/search 里那枚只属于旧 UI 的 `search.isShowHistorySearch` 写闸，见该文件头注）。
 * 动作为既有 playQueue / pushNewUiSonglistDetail（阶段 9c 换线）。
 * 与原型差异：真实搜索是异步的，补 loading 态；结果按提交（回车 / 点词）触发，不做逐字本地过滤。
 * 2026-10-15（拆件转正轮）：`.sc-top` 原内联单元转正为独立组件 SearchTop，渲染零变化、接线原样。
 */
export const SearchScreen = ({ componentId }: SearchScreenProps) => {
  const theme = useTheme()
  const { top, bottom } = useSafeArea()
  // 轻量宽屏档：本屏三处滚动容器（空输入态 + 结果两 tab）共用同一个内容盒限宽，
  // 切 tab 时盒子不跳；竖屏档 boxStyle 是 undefined = 不写任何宽样式（零变化）
  const { boxStyle } = useWideLayout()
  useNewUiSystemBar(componentId)

  const assertApiSupport = useApiSupport()
  const nowPlaying = useNowPlaying()

  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<NewUiSearchTab>('song')
  const [loading, setLoading] = useState(false)
  const [songs, setSongs] = useState<LX.Music.MusicInfoOnline[]>([])
  const [pls, setPls] = useState<ListInfoItem[]>([])
  // null = 还没从本机读完（冷启动首帧）：先不渲染历史区，避免闪一下空态那行
  const [history, setHistory] = useState<string[] | null>(peekSearchHistory)
  const [hotWords, setHotWords] = useState<string[]>([])

  const inputRef = useRef<TextInput>(null)
  // 只认最后一次提交的搜索：慢回来的旧结果直接丢弃（原型本地过滤无此问题，异步必须有）
  const seqRef = useRef(0)
  // 单曲操作面板（原型搜索结果行 ⋯ → openMore，app.js L1466；9e 接线）
  const [moreMusic, setMoreMusic] = useState<LX.Music.MusicInfo | null>(null)
  const closeMore = useCallback(() => setMoreMusic(null), [])
  const handleSongMore = useCallback((index: number) => {
    const song = songs[index]
    if (song != null) setMoreMusic(song)
  }, [songs])

  // —— 空输入态的两组词：历史 + 真实热搜（进页取一次） ——
  // 本屏每次打开都是新挂载（push/pop 整层），所以「进页读一次」就等于「每次都读最新」；
  // 历史走本目录的 searchHistory 适配层（见该文件头注：新 UI 不依赖旧 UI 那枚历史开关）
  useEffect(() => {
    void (async () => {
      setHistory(await readSearchHistory())
    })()
    void (async () => {
      try {
        const list = await getHotSearchList('all')
        setHotWords(list.slice(0, NEW_UI_SEARCH_HOT_LIMIT))
      } catch {
        // 热搜失败不拦截搜索：空输入态照常给历史与提示
      }
    })()
  }, [])

  const runSearch = useCallback((word: string) => {
    const seq = ++seqRef.current
    setLoading(true)
    void Promise.allSettled([
      searchMusic(word, 1, 'all'),
      searchSonglist(word, 1, 'all'),
    ]).then(([songRes, plRes]) => {
      if (seq !== seqRef.current) return
      // 单平台失败已在 core 内 catch；这里兜的是整体异常（如网络断），给空结果走空态文案
      setSongs(songRes.status === 'fulfilled' ? songRes.value : [])
      setPls(plRes.status === 'fulfilled' ? plRes.value : [])
      setLoading(false)
    })
  }, [])

  /** 落位规则每轮搜索只执行一次的标记（QA D-07，详见下方落位 effect 注释） */
  const landedRef = useRef(false)

  /** 提交搜索（回车 / 点历史热搜词）：同原型 pickQuery，先记历史再搜，换词自动落到有结果的一类 */
  const submit = useCallback((raw: string) => {
    const word = raw.trim()
    if (!word) return
    setText(word)
    setQuery(word)
    void (async () => {
      // 记词：提到最前、去重、截 8 条并写回本机，返回值即写后的最新列表（省一次读）
      setHistory(await rememberSearchWord(word))
    })()
    runSearch(word)
    // 换词时的初始 tab：下面两个结果长度要读最新值，统一在 allSettled 回调里判定更稳，
    // 这里先归位 song，结果回来后若 song 空而 pl 有 → 在 runSearch 完成处再切。
    setTab('song')
    landedRef.current = false
  }, [runSearch])

  // 换词落位规则（原型 app.js L2404-2408 双向：song 空而 pl 有 → 翻到 pl，
  // pl 空而 song 有 → 落回 song；QA D02 补齐反向那一支）。
  // QA 2026-10-14 D-07：本判定依赖 tab，每次重跑都再 setTab，
  // 用户手动切回空的一类会被立刻抢回——落位只在每个搜索周期执行一次（landedRef），
  //  submit 时重置，换词照常落位。
  useEffect(() => {
    if (loading || !query || landedRef.current) return
    landedRef.current = true
    if (tab === 'song' && !songs.length && pls.length) setTab('pl')
    else if (tab === 'pl' && !pls.length && songs.length) setTab('song')
  }, [loading, query, tab, songs.length, pls.length])

  // —— 结果视图模型（容器算好，面板纯展示）——
  // 单曲行可达上百条（'all' 合并搜索每平台约 30 首）：每首的「能否播」只判一次、
  // 「播全部可播数」直接从这份视图模型汇总，避免整批重算两遍
  const resultSongs = useMemo<SearchResultSong[]>(
    () => songs.map(song => {
      const playable = assertApiSupport(song.source)
      return {
        id: song.id,
        // 'all' 合并搜索跨平台同 id 会撞 key：容器补 source 限定（2026-10-13 切 tab 崩溃轮顺带修）
        key: `${song.source}-${song.id}`,
        display: toSongDisplay(song, playable),
        music: song,
        playable,
        active: nowPlaying.id === song.id,
        playing: nowPlaying.id === song.id && nowPlaying.playing,
      }
    }),
    [assertApiSupport, nowPlaying.id, nowPlaying.playing, songs],
  )

  const playableCount = useMemo(
    () => resultSongs.reduce((count, song) => count + (song.playable ? 1 : 0), 0),
    [resultSongs],
  )

  const handleSongPress = useCallback((index: number) => {
    const song = songs[index]
    if (song == null) return
    if (!assertApiSupport(song.source)) {
      showNewUiToast(NEW_UI_SEARCH_UNPLAYABLE_TOAST)
      return
    }
    void playQueue(`search__${query}`, songs, index)
  }, [assertApiSupport, query, songs])

  const handlePlayAll = useCallback(() => {
    const playable = songs.filter(song => assertApiSupport(song.source))
    if (!playable.length) return
    void playQueue(`search__${query}`, playable, 0)
  }, [assertApiSupport, query, songs])

  const handlePlPress = useCallback((item: ListInfoItem) => {
    // 搜索条目形状由平台 filter 决定，与目录条目不严格一致（详见 utils/searchListInfo.ts 头注）；
    // 归一化后坐标仍不完整（缺 source / 空 id）就不进详情页，避免点开即崩（清单第 6 条）
    const info = normalizeSearchListInfoItem(item)
    if (info == null) {
      showNewUiToast(NEW_UI_SEARCH_PL_INVALID_TOAST)
      return
    }
    pushNewUiSonglistDetail(componentId, info)
  }, [componentId])

  /** 原型此钮两步：closeSearch() + switchTab('setting')（app.js scEmpty L2329-2333）。
   * RN 等价接线（10b 轮补真，此前只 pop 不切页、到不了设定）：先向存活的主屏投递目标 Tab，
   * 再 pop 回去——主屏 subscribeNewUiTab 收到即落设定页，见 utils/tabJump。不新造路由。 */
  const handleGotoSetting = useCallback(() => {
    requestNewUiTab('setting')
    void Navigation.pop(componentId)
  }, [componentId])

  const handleCancel = useCallback(() => {
    void Navigation.pop(componentId)
  }, [componentId])

  /**
   * 回到空输入态（QA 2026-10-14 D-12 + 卫生项）：✕ 钮与退格清光共用这一个实现。
   * 旧状：①退格到空只改输入框，query 还挂着——结果面板赖在历史/热搜位不走；
   * ②✕ 没递增 seqRef，在途搜索晚落地会把旧结果与 loading 写回空态（屏上看不见但状态脏）。
   * 现在递增 seqRef 作废在途请求（runSearch 里的 seq 闸自然丢弃），再清空五个状态。
   */
  const resetToIdle = useCallback(() => {
    ++seqRef.current
    setText('')
    setQuery('')
    setSongs([])
    setPls([])
    setLoading(false)
  }, [])

  const handleClearText = useCallback(() => {
    resetToIdle()
    inputRef.current?.focus()
  }, [resetToIdle])

  // 逐字退格不回空态（原型本地过滤无此问题，RN 提交式搜索必须给空串分支）；中途改词不重搜，仍等提交
  const handleChangeText = useCallback((value: string) => {
    if (value.length === 0) {
      resetToIdle()
      return
    }
    setText(value)
  }, [resetToIdle])

  /** 清空整区（原型 .sc-clear：清完写回本机空数组，重启不回魂，见 searchHistory.ts） */
  const handleClearHistory = useCallback(() => {
    void (async () => {
      setHistory(await clearSearchHistory())
    })()
  }, [])

  const hasQuery = query.length > 0

  return (
    <View
      nativeID="newui.search.content"
      style={[styles.root, { backgroundColor: theme.colors.bg }]}
    >
      {/* .sc-top：状态栏留白 + 输入框（聚焦亮主色环）+ 清除 + 取消 */}
      <SearchTop
        ref={inputRef}
        value={text}
        focused={focused}
        topInset={top}
        placeholder={NEW_UI_SEARCH_INPUT_PLACEHOLDER}
        cancelLabel={NEW_UI_SEARCH_CANCEL}
        clearLabel="清空输入"
        onChangeText={handleChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmit={() => { submit(text) }}
        onClear={handleClearText}
        onCancel={handleCancel}
      />

      {/* 结果模式：tabs 常驻在滚动区上方（替代原型 sticky，效果一致） */}
      {hasQuery && !loading && (
        <SearchTabs
          tab={tab}
          songCount={songs.length}
          plCount={pls.length}
          onTabChange={setTab}
        />
      )}

      {/* 空输入态：历史 + 热搜，内容不长，沿用普通滚动容器。
          结果态：面板自带虚拟列表（切 tab 卡顿的真机走查修复点，见 SearchResultPanel），
          不能再套外层 ScrollView——嵌套滚动会双份手势与测量 */}
      {hasQuery ? (
        <View style={styles.body}>
          <SearchResultPanel
            query={query}
            loading={loading}
            tab={tab}
            songs={resultSongs}
            playableCount={playableCount}
            pls={pls}
            contentPaddingBottom={SEARCH.bodyPaddingBottom + bottom}
            onTabChange={setTab}
            onSongPress={handleSongPress}
            onSongMore={handleSongMore}
            onPlPress={handlePlPress}
            onPlayAll={handlePlayAll}
            onGotoSetting={handleGotoSetting}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            { paddingBottom: SEARCH.bodyPaddingBottom + bottom },
            boxStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SearchIdlePanel
            history={history}
            hotWords={hotWords}
            onPick={submit}
            onClearHistory={handleClearHistory}
          />
        </ScrollView>
      )}
      {/* 常驻迷你播放条：本层默认磁吸圆点（原型 miniPageSnapped：不在首页就是圆点）。
          排在单曲面板与提示胶囊之前——圆点浮在搜索结果之上，弹层与胶囊仍盖过它 */}
      <MinibarHost componentId={componentId} bottomInset={bottom} defaultSnapped />
      {/* 单曲操作面板（原型 #moreSheet）：本屏搜索结果行的 ⋯ 目标曲在这里 */}
      <MoreSheet
        visible={moreMusic != null}
        musicInfo={moreMusic}
        onClose={closeMore}
        bottomInset={bottom}
      />
      {/* 提示胶囊（QA D-09）：屏幕根层最后一子——原型 .toast z-index:90 压过浮层 */}
      <NewUiToastHost bottomInset={bottom} />
    </View>
  )
}

SearchScreen.displayName = 'NewUISearchScreen'

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** .sc-body padding:0 16 40 */
  body: {
    flex: 1,
    minHeight: 0,
  },
  bodyContent: {
    paddingHorizontal: SEARCH.bodyPaddingX,
  },
})
