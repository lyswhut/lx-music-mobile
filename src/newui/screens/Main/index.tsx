import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { StyleSheet, View } from 'react-native'
import { Navigation } from 'react-native-navigation'

import { useSettingValue } from '@/store/setting/hook'

import { ConfirmSheet, NewUiToastHost, PageViewport, PlayCircle, TabBar, TopBar } from '@/newui/components'
import {
  NEW_UI_SEARCH_PLACEHOLDER,
  NEW_UI_SETTING_LABELS,
  NEW_UI_TABS,
  PLATFORM_SOURCE_KEYS,
  type NewUiTabKey,
} from '@/newui/const'
import { useApiSupport, emitPageEndReached, useNickName, useRecentPlayRecorder, useSafeArea } from '@/newui/hooks'
// 直连 navigation/entry（绕开桶口），与各页跳播放同一做法，防 register→screens→pages 循环引用
import { pushNewUiPlayer, pushNewUiSearch } from '@/newui/navigation/entry'
import { subscribeNewUiTab } from '@/newui/utils'
import { RANK_PAGING, newUiStatusBarStyle, useTheme, useThemeMode } from '@/newui/theme'

import { MinePage, PlaylistPage, RankPage, SettingPage } from './pages'
import { CreateListSheet, MoreSheet, NameSheet, PlTagsSheet, SourceSheet } from './sheets'
import type { NewUiPageProps } from '../types'

export interface MainScreenProps {
  /** react-native-navigation 注入的组件 ID */
  componentId: string
}

/** Tab key → 页面组件 */
const PAGES: Record<NewUiTabKey, ComponentType<NewUiPageProps>> = {
  // 原「歌单」页即现在的「首页」（工具栏文案由 const/tabs 决定）
  playlist: PlaylistPage,
  rank: RankPage,
  mine: MinePage,
  setting: SettingPage,
}

/**
 * 自带主滚动容器（整页虚拟化）的 Tab，只有已成为「首页」的歌单页：
 * 不与共用 PageViewport 叠加，避免两套滚动源抢手势；切 Tab 时页面类型变化，自然重挂载回顶。
 */
const SELF_SCROLLING_TABS: readonly NewUiTabKey[] = ['playlist']

/**
 * 新 UI 主屏幕骨架：顶栏 / 页面 / Tab 栏，顶栏与 Tab 栏是绝对定位浮层。
 * 只管「当前 Tab / 顶栏投影状态 / 系统栏配色」，业务数据由各页面自行接入既有 store。
 */
export const MainScreen = ({ componentId }: MainScreenProps) => {
  const theme = useTheme()
  const { scheme } = useThemeMode()
  const { top, bottom } = useSafeArea()
  // 顶栏头像与本页、浮层预览读同一份昵称 / 头像状态；未设置时回落品牌首字母
  const { initial: avatarText, avatarUri } = useNickName()
  const [tabKey, setTabKey] = useState<NewUiTabKey>('playlist')
  const [pinned, setPinned] = useState(false)
  // 「最近播放」记录仪：主屏存活期间订阅切歌事件（任何入口播过的歌都记），「我的」页读取展示
  useRecentPlayRecorder()
  // 音源浮层挂在主屏根层，顶栏音源钮独占这一个实例
  const [sourceSheetVisible, setSourceSheetVisible] = useState(false)
  // 「修改」浮层：同层挂载，盖过 Tab 栏
  const [nameSheetVisible, setNameSheetVisible] = useState(false)
  // 单曲操作面板；目标曲目为空即退场
  const [moreMusic, setMoreMusic] = useState<LX.Music.MusicInfo | null>(null)
  // 「全部分类」浮层（chip 行末尾入口）；选中态经 playlistTagSelection 共享模块传递，这里只管显隐
  const [plTagsSheetVisible, setPlTagsSheetVisible] = useState(false)
  // 新建歌单浮层；入口在我的页「我的歌单」区块右上角
  const [createListSheetVisible, setCreateListSheetVisible] = useState(false)
  // 「清除缓存」二次确认浮层：挂根层（设定页在滚动内容里，自挂 absolute 会错位）；
  // 真清除动作留在 SettingPage，经 onRegisterClearCache 注册进来
  const [clearCacheConfirmVisible, setClearCacheConfirmVisible] = useState(false)
  const clearCacheActionRef = useRef<(() => void) | null>(null)

  // 顶栏状态点：只表示「音源还没配好」，配好后整颗撤掉（无常驻绿点）；
  // 按在线平台判定，纯本地音源也会显 warn。每次直算不用 useMemo：依赖带不到 apiSourceUpdated 事件脉冲。
  const apiSource = useSettingValue('common.apiSource')
  const assertApiSupport = useApiSupport()
  const sourceDot: 'warn' | undefined =
    apiSource && PLATFORM_SOURCE_KEYS.some(s => assertApiSupport(s)) ? undefined : 'warn'

  const openSourceSheet = useCallback(() => setSourceSheetVisible(true), [])
  const closeSourceSheet = useCallback(() => setSourceSheetVisible(false), [])

  const openNameSheet = useCallback(() => setNameSheetVisible(true), [])
  const closeNameSheet = useCallback(() => setNameSheetVisible(false), [])

  // 主屏内列表（我的页最近播放）的 ⋯ 钮走这里
  const openMore = useCallback((musicInfo: LX.Music.MusicInfo) => setMoreMusic(musicInfo), [])
  const closeMore = useCallback(() => setMoreMusic(null), [])

  // 歌单页 chip 行末尾「全部分类」入口
  const openPlTagsSheet = useCallback(() => setPlTagsSheetVisible(true), [])
  const closePlTagsSheet = useCallback(() => setPlTagsSheetVisible(false), [])

  const openCreateListSheet = useCallback(() => setCreateListSheetVisible(true), [])
  const closeCreateListSheet = useCallback(() => setCreateListSheetVisible(false), [])

  const openClearCacheConfirm = useCallback(() => setClearCacheConfirmVisible(true), [])
  const closeClearCacheConfirm = useCallback(() => setClearCacheConfirmVisible(false), [])
  const registerClearCache = useCallback((action: (() => void) | null) => {
    clearCacheActionRef.current = action
  }, [])
  // ConfirmSheet 内部先收层再回调；设定页已卸载注销时静默不动
  const confirmClearCache = useCallback(() => { clearCacheActionRef.current?.() }, [])

  // 系统栏配色跟随新 UI 主题（启动用深色打底，这里校正为实际 scheme）
  useEffect(() => {
    Navigation.mergeOptions(componentId, {
      statusBar: { style: newUiStatusBarStyle(scheme) },
      navigationBar: { backgroundColor: theme.colors.bg },
      layout: { componentBackgroundColor: theme.colors.bg },
    })
  }, [componentId, scheme, theme.colors.bg])

  // 切页 + 顶栏脱吸顶（滚动位置靠页面重挂载复位）
  const selectTab = useCallback((key: NewUiTabKey) => {
    setTabKey(key)
    setPinned(false)
  }, [])

  // 推入式整屏可请求切 Tab：发起屏投递后自行 pop 回来（见 utils/tabJump，不新造路由）
  useEffect(() => subscribeNewUiTab(selectTab), [selectTab])

  const handleSelect = useCallback(
    (key: string) => selectTab(key as NewUiTabKey),
    [selectTab],
  )

  // 顶栏搜索框：全屏右推搜索页，自动聚焦输入
  const handleSearchPress = useCallback(() => {
    void pushNewUiSearch(componentId)
  }, [componentId])

  // 工具栏中央播放圆圈：只负责开播放页；「没有曲目」的提示由 PlayCircle 自己拦掉
  const handlePlayCirclePress = useCallback(() => {
    void pushNewUiPlayer(componentId)
  }, [componentId])
  const centerSlot = useMemo(
    () => <PlayCircle onPress={handlePlayCirclePress} />,
    [handlePlayCirclePress],
  )

  const Page = PAGES[tabKey]

  // 顶栏头像入口：切「我的」。用 useCallback 保持引用稳定，否则 TopBar 的 memo 失效
  const handleAvatarPress = useCallback(() => selectTab('mine'), [selectTab])

  // —— 页面子树的元素级 memo ——
  // pinned / 浮层显隐 / sourceDot 等主屏状态一变就重渲染 MainScreen，
  // 缓存 Page 元素可跳过整棵页面子树（主题切换靠 context 穿透，不受影响）。
  const pageNode = useMemo(() => (
    <Page
      componentId={componentId}
      onSwitchTab={selectTab}
      onOpenSourceSheet={openSourceSheet}
      onOpenNameSheet={openNameSheet}
      onOpenMore={openMore}
      onOpenPlTagsSheet={openPlTagsSheet}
      onOpenCreateListSheet={openCreateListSheet}
      onOpenClearCacheConfirm={openClearCacheConfirm}
      onRegisterClearCache={registerClearCache}
      // 整页虚拟化的页（歌单页）自带滚动容器，pinned 信号与 insets 经这个口回传主屏
      onViewportPinnedChange={setPinned}
      viewportTopInset={top}
      viewportBottomInset={bottom}
    />
  ), [
    Page,
    componentId,
    selectTab,
    openSourceSheet,
    openNameSheet,
    openMore,
    openPlTagsSheet,
    openCreateListSheet,
    openClearCacheConfirm,
    registerClearCache,
    top,
    bottom,
  ])

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      {/* 自带滚动容器的页不再套 PageViewport：触底信号直连页面自身逻辑，不走 usePageEndReached 总线 */}
      {SELF_SCROLLING_TABS.includes(tabKey)
        ? pageNode
        : (
          <PageViewport
            key={tabKey}
            bottomInset={bottom}
            // 触底广播：三页共用的滚动容器只负责「到底了」，由页面经 usePageEndReached 注册处理；
            // 触发线取距底 160px（RANK_PAGING）
            endReachedDistance={RANK_PAGING.endReachedDistance}
            onEndReached={emitPageEndReached}
            onPinnedChange={setPinned}
            topInset={top}
          >
            {pageNode}
          </PageViewport>
        )}
      <TopBar
        avatarText={avatarText}
        avatarImageUri={avatarUri}
        onAvatarPress={handleAvatarPress}
        onSearchPress={handleSearchPress}
        searchPlaceholder={NEW_UI_SEARCH_PLACEHOLDER}
        sourceDot={sourceDot}
        // 顶栏音源钮：手机端音源入口
        onSourcePress={openSourceSheet}
        pinned={pinned}
        topInset={top}
      />
      <View style={styles.tabBarWrap}>
        <TabBar
          items={NEW_UI_TABS}
          activeKey={tabKey}
          bottomInset={bottom}
          onSelect={handleSelect}
          centerSlot={centerSlot}
        />
      </View>
      {/* 浮层按 z-index 排在最后：sheet 80、toast 90 */}
      {/* 音源设置浮层：盖过 Tab 栏 */}
      <SourceSheet
        visible={sourceSheetVisible}
        onClose={closeSourceSheet}
        bottomInset={bottom}
      />
      {/* 「修改」浮层（昵称 + 头像）：后挂载者盖在其上 */}
      <NameSheet
        visible={nameSheetVisible}
        onClose={closeNameSheet}
        bottomInset={bottom}
      />
      {/* 单曲操作面板：主屏内歌曲行 ⋯ 的目标曲 */}
      <MoreSheet
        visible={moreMusic != null}
        musicInfo={moreMusic}
        onClose={closeMore}
        bottomInset={bottom}
      />
      {/* 全部分类浮层：歌单页 chip 行末尾「全部分类」入口；选中分类后经共享模块回流页面与推荐池 */}
      <PlTagsSheet
        visible={plTagsSheetVisible}
        onClose={closePlTagsSheet}
        bottomInset={bottom}
      />
      {/* 新建歌单浮层：我的页「我的歌单」右上角入口 */}
      <CreateListSheet
        visible={createListSheetVisible}
        onClose={closeCreateListSheet}
        bottomInset={bottom}
      />
      {/* 「清除缓存」二次确认：标题不传则回落默认问句，正文 / 按钮文案取自 const/setting，
          清除本体在 SettingPage */}
      <ConfirmSheet
        visible={clearCacheConfirmVisible}
        body={NEW_UI_SETTING_LABELS.clearConfirm}
        okLabel={NEW_UI_SETTING_LABELS.clearConfirmButton}
        onConfirm={confirmClearCache}
        onClose={closeClearCacheConfirm}
        bottomInset={bottom}
      />
      {/* 提示胶囊：根层最后一子，压过浮层 */}
      <NewUiToastHost bottomInset={bottom} />
    </View>
  )
}

MainScreen.displayName = 'NewUIMainScreen'

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** Tab 栏：底部绝对定位浮层 */
  tabBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
})
