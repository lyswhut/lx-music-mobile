import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, StyleSheet, View, type TextInput } from 'react-native'
import { Navigation } from 'react-native-navigation'

import { search as searchMusic } from '@/core/search/music'
import { search as searchSonglist } from '@/core/search/songlist'
import { getList as getHotSearchList } from '@/core/hotSearch'
import type { ListInfoItem } from '@/store/songlist/state'

// 直连 entry 而非 '@/newui/navigation' 桶口：避免 navigation/index → register → screens → 本文件的循环引用
import { pushNewUiSonglistDetail } from '@/newui/navigation/entry'

import { NewUiToastHost, SearchTop } from '@/newui/components'
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
 * 搜索层：全屏右推屏幕，数据走 core/search/music + core/search/songlist（'all' 合并搜索）+ core/hotSearch；
 * 「搜过的词」走本目录 searchHistory 适配层。动作为既有 playQueue / pushNewUiSonglistDetail。
 * 注意：真实搜索是异步的，补 loading 态；结果按提交触发，不做逐字本地过滤。
 */
export const SearchScreen = ({ componentId }: SearchScreenProps) => {
  const theme = useTheme()
  const { top, bottom } = useSafeArea()
  // 宽屏档：三处滚动容器共用同一内容盒限宽，切 tab 不跳；竖屏档 boxStyle 为 undefined
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
  // 只认最后一次提交：慢回来的旧结果直接丢弃
  const seqRef = useRef(0)
  // 单曲操作面板目标
  const [moreMusic, setMoreMusic] = useState<LX.Music.MusicInfo | null>(null)
  const closeMore = useCallback(() => setMoreMusic(null), [])
  const handleSongMore = useCallback((index: number) => {
    const song = songs[index]
    if (song != null) setMoreMusic(song)
  }, [songs])

  // —— 空输入态的两组词：历史 + 真实热搜，进页各取一次（本层每次打开都是新挂载）——
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

  /** 落位规则每个搜索周期只执行一次的标记 */
  const landedRef = useRef(false)

  /** 提交搜索（回车 / 点词）：先记历史再搜，换词自动落到有结果的一类 */
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
    // 换词时先归位 song，结果回来后若 song 空而 pl 有 → 由下方落位 effect 切过去
    setTab('song')
    landedRef.current = false
  }, [runSearch])

  // 换词落位：song 空而 pl 有 → 翻到 pl，反向亦然。
  // 判定依赖 tab 且每次重跑都会 setTab，故每个搜索周期只执行一次（landedRef），
  // submit 时重置；否则用户手动切回空的一类会被立刻抢回。
  useEffect(() => {
    if (loading || !query || landedRef.current) return
    landedRef.current = true
    if (tab === 'song' && !songs.length && pls.length) setTab('pl')
    else if (tab === 'pl' && !pls.length && songs.length) setTab('song')
  }, [loading, query, tab, songs.length, pls.length])

  // —— 结果视图模型（容器算好，面板纯展示）——
  // 每首的可播态只判一次，可播数直接从这份汇总，避免整批重算两遍
  const resultSongs = useMemo<SearchResultSong[]>(
    () => songs.map(song => {
      const playable = assertApiSupport(song.source)
      return {
        id: song.id,
        // 'all' 合并搜索跨平台同 id 会撞 key：容器补 source 限定
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
    // 搜索条目形状由平台 filter 决定；归一化后坐标仍不完整（缺 source / 空 id）就不进详情页，避免点开即崩
    const info = normalizeSearchListInfoItem(item)
    if (info == null) {
      showNewUiToast(NEW_UI_SEARCH_PL_INVALID_TOAST)
      return
    }
    pushNewUiSonglistDetail(componentId, info)
  }, [componentId])

  /** 空态「去设定里看音源」：先向存活主屏投递目标 Tab，再 pop 本层（utils/tabJump 通道）。 */
  const handleGotoSetting = useCallback(() => {
    requestNewUiTab('setting')
    void Navigation.pop(componentId)
  }, [componentId])

  const handleCancel = useCallback(() => {
    void Navigation.pop(componentId)
  }, [componentId])

  /** 回到空输入态（✕ 钮与退格清光共用）：先递增 seqRef 作废在途请求，再清空输入与结果状态。 */
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

  // 逐字退格到空串才回空态；中途改词不重搜，仍等提交
  const handleChangeText = useCallback((value: string) => {
    if (value.length === 0) {
      resetToIdle()
      return
    }
    setText(value)
  }, [resetToIdle])

  /** 清空整区并写回本机空数组（重启不回魂，见 searchHistory.ts） */
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
      {/* 顶栏：状态栏留白 + 输入框（聚焦亮主色环）+ 清除 + 取消 */}
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

      {/* 结果模式：tabs 常驻在滚动区上方 */}
      {hasQuery && !loading && (
        <SearchTabs
          tab={tab}
          songCount={songs.length}
          plCount={pls.length}
          onTabChange={setTab}
        />
      )}

      {/* 空输入态用普通滚动容器；结果态面板自带虚拟列表，不能再套外层 ScrollView（嵌套滚动会双份手势与测量） */}
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
      {/* 单曲操作面板：本屏搜索结果行的 ⋯ 目标曲在这里 */}
      <MoreSheet
        visible={moreMusic != null}
        musicInfo={moreMusic}
        onClose={closeMore}
        bottomInset={bottom}
      />
      {/* 提示胶囊：屏幕根层最后一子，压在浮层之上 */}
      <NewUiToastHost bottomInset={bottom} />
    </View>
  )
}

SearchScreen.displayName = 'NewUISearchScreen'

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  bodyContent: {
    paddingHorizontal: SEARCH.bodyPaddingX,
  },
})
