import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { StyleSheet, View } from 'react-native'
import { Navigation } from 'react-native-navigation'

import { useSettingValue } from '@/store/setting/hook'

import { ConfirmSheet, MinibarHost, NewUiToastHost, PageViewport, TabBar, TopBar } from '@/newui/components'
import {
  NEW_UI_SEARCH_PLACEHOLDER,
  NEW_UI_SETTING_LABELS,
  NEW_UI_TABS,
  PLATFORM_SOURCE_KEYS,
  type NewUiTabKey,
} from '@/newui/const'
import { useApiSupport, emitPageEndReached, useNickName, useRecentPlayRecorder, useSafeArea, useWideLayout } from '@/newui/hooks'
// 直连 navigation/entry（绕开桶口），与 MinibarHost / 各页跳播放同一做法，防 register→screens→pages 循环引用
import { pushNewUiSearch } from '@/newui/navigation/entry'
import { subscribeNewUiTab } from '@/newui/utils'
import { RANK_PAGING, newUiStatusBarStyle, useTheme, useThemeMode } from '@/newui/theme'

import {
  HomePage,
  MinePage,
  PlaylistPage,
  RankPage,
  SettingPage,
} from './pages'
import { CatStickerBar } from './CatStickerBar'
import { CreateListSheet, MoreSheet, NameSheet, PlIdSheet, PlTagsSheet, SourceSheet } from './sheets'
import type { NewUiPageProps } from '../types'

export interface MainScreenProps {
  /** react-native-navigation 注入的组件 ID */
  componentId: string
}

/** Tab key → 页面组件（原型 app.js 的 PAGES / switchTab 映射） */
const PAGES: Record<NewUiTabKey, ComponentType<NewUiPageProps>> = {
  home: HomePage,
  playlist: PlaylistPage,
  rank: RankPage,
  mine: MinePage,
  setting: SettingPage,
}

/**
 * 自带主滚动容器（PageListView 整页虚拟化）的 Tab（2026-10-16 推荐池 OOM 轮：
 * 第 1 站点歌单页、第 2 站点首页）。这些页**不再套下面的共用 PageViewport**——
 * 虚拟化列表嵌进裸 ScrollView 会抢滚动手势（Sheet.tsx L50-52 的嵌套滚动教训），两条滚动源二选一。
 * 切 Tab 回顶仍成立：这一族的页面在根层是「裸 pageNode」，tabKey 一变 Page 组件类型就变，
 * React 整棵卸载重挂（与旧 PageViewport key={tabKey} 重挂载等价），FlatList 从 offset 0 起。
 * 其余页面内容定长，继续共用主屏这一个 PageViewport 实例。
 */
const SELF_SCROLLING_TABS: readonly NewUiTabKey[] = ['home', 'playlist']

/**
 * 新 UI 主屏幕骨架（对应原型 .screen：.topbar + .viewport + .tabbar）。
 * 顶栏与 Tab 栏都是绝对定位浮层，页面滚动内容从其下穿过，复现原型的半透明渐变底。
 * 界面层容器：只管「当前 Tab / 吸顶状态 / 系统栏配色」，业务数据由各页面自行接入既有 store。
 */
export const MainScreen = ({ componentId }: MainScreenProps) => {
  const theme = useTheme()
  const { scheme } = useThemeMode()
  const { top, bottom } = useSafeArea()
  // 顶栏总高按档走（宽屏 92 / 竖屏 110）：吸顶触发线的换算与 TopBar 盒高、CatStickerBar 的 paddingTop
  // 必须同源同一个 useWideLayout，否则横屏档这三处会错开
  const { topBarHeight } = useWideLayout()
  // 原型 renderProfile：顶栏头像与我的页、浮层预览读同一份 state（昵称首字 + 头像图）；
  // 未设置昵称时 useNickName 回落品牌首字母「E」，头像路径指空时回落首字
  const { initial: avatarText, avatarUri } = useNickName()
  const [tabKey, setTabKey] = useState<NewUiTabKey>('home')
  const [pinned, setPinned] = useState(false)
  // 歌单页分类条吸顶（QA 2026-10-14 D-06，原型 .cat-row position:sticky）：
  // RN 0.73 的 stickyHeaderIndices 要求吸顶元素是 ScrollView 直接 children 且钉在 0（会被顶栏浮层盖住），
  // fragment 页面不满足 → 采用「主屏根层复制浮层 + 滚动越线判定」。
  // catLineRef：分类条原位在内容坐标系里的吸顶触发线（页面 onLayout 上报换算而来），null = 未上报不出条。
  const [catStuck, setCatStuck] = useState(false)
  const catLineRef = useRef<number | null>(null)
  // 「最近播放」历史记录仪（utils/recentPlay）：主屏存活期间订阅切歌事件，
  // 任何入口（首页/搜索/榜单/播放页）播过的歌都记下来，「我的」页读取展示
  useRecentPlayRecorder()
  // 原型 #sourceSheet 是 .screen 内的覆盖层（index.html L374）：RN 同款挂在主屏根层，
  // 顶栏波纹钮与首页「音源公告」轮播共用这一个实例（app.js L1585 castBtn / L1570 navFoot 都是开它）
  const [sourceSheetVisible, setSourceSheetVisible] = useState(false)
  // 「修改」浮层（原型 #nameSheet，app.js #mineEdit L1591 → openNameSheet）；同层挂载，盖过 Tab 栏
  const [nameSheetVisible, setNameSheetVisible] = useState(false)
  // 单曲操作面板（原型 #moreSheet，app.js openMore L722）；目标曲目为空即退场
  const [moreMusic, setMoreMusic] = useState<LX.Music.MusicInfo | null>(null)
  // 「打开歌单」浮层（原型 #plIdSheet，app.js openPlIdSheet L510）；入口 = 歌单页页头链接胶囊
  const [plIdSheetVisible, setPlIdSheetVisible] = useState(false)
  // 「全部分类」浮层（chip 行末尾入口）；选中态经 playlistTagSelection 共享模块传递，这里只管显隐
  const [plTagsSheetVisible, setPlTagsSheetVisible] = useState(false)
  // 新建歌单浮层（2026-10-13 bug-fix「我的」7a）；入口 = 我的页「我的歌单」区块右上角
  const [createListSheetVisible, setCreateListSheetVisible] = useState(false)
  // 「清除缓存」二次确认浮层（QA 2026-10-14 第 13 轮：设定页残留的系统 confirmDialog 换回
  // 共通件 ConfirmSheet）。与其余浮层同理挂根层（设定页在滚动内容里，自挂 absolute 会错位）；
  // 真清除动作仍留在 SettingPage，经 onRegisterClearCache 注册进这个 ref，按「清除」时回调执行
  const [clearCacheConfirmVisible, setClearCacheConfirmVisible] = useState(false)
  const clearCacheActionRef = useRef<(() => void) | null>(null)

  // 顶栏状态点（.pulse-dot，原型 app.js renderNav L2451-2459）：这颗点只表示「有事没办完」——
  // 音源配好了整颗撤掉（`$('#castDot').hidden = s.state === 'ready'`），没配好才是琥珀 warn；
  // 没有常驻绿点那一档。长亮着的绿点不是状态，是装饰。
  // useApiSupport 内部订阅 apiSourceUpdated，启动加载完成 / 切源后整屏重渲染，
  // 这里每次直算（五平台判定，开销可忽略；不用 useMemo——依赖里带不到事件脉冲，
  // 会把启动后的新状态滞留成旧值）。注意口径按在线平台计：纯本地党音源也会显 warn（原型无本地概念）。
  const apiSource = useSettingValue('common.apiSource')
  const assertApiSupport = useApiSupport()
  const sourceDot: 'warn' | undefined =
    apiSource && PLATFORM_SOURCE_KEYS.some(s => assertApiSupport(s)) ? undefined : 'warn'

  const openSourceSheet = useCallback(() => setSourceSheetVisible(true), [])
  const closeSourceSheet = useCallback(() => setSourceSheetVisible(false), [])

  const openNameSheet = useCallback(() => setNameSheetVisible(true), [])
  const closeNameSheet = useCallback(() => setNameSheetVisible(false), [])

  // 原型 songRow 的 ⋯ 钮（app.js L307-312）：主屏内列表（我的页最近播放）走这里
  const openMore = useCallback((musicInfo: LX.Music.MusicInfo) => setMoreMusic(musicInfo), [])
  const closeMore = useCallback(() => setMoreMusic(null), [])

  // 原型 #plOpenBtn（app.js L1597）：歌单页页头「按链接打开」胶囊开这一浮层
  const openPlIdSheet = useCallback(() => setPlIdSheetVisible(true), [])
  const closePlIdSheet = useCallback(() => setPlIdSheetVisible(false), [])

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
  // ConfirmSheet 内部先收层再回调（原型 cfOk.onclick 同序）；设定页已卸载注销时静默不动
  const confirmClearCache = useCallback(() => { clearCacheActionRef.current?.() }, [])

  // 系统栏配色跟随新 UI 主题（启动 options 用深色打底，这里校正为实际 scheme）
  useEffect(() => {
    Navigation.mergeOptions(componentId, {
      statusBar: { style: newUiStatusBarStyle(scheme) },
      navigationBar: { backgroundColor: theme.colors.bg },
      layout: { componentBackgroundColor: theme.colors.bg },
    })
  }, [componentId, scheme, theme.colors.bg])

  // 原型 switchTab：切页 + 滚动位置复位（由 PageViewport 的 key 重挂载实现）+ 顶栏脱吸顶
  const selectTab = useCallback((key: NewUiTabKey) => {
    setTabKey(key)
    setPinned(false)
    // 切页同轮复位分类条吸顶态：新页面的 onLayout 会重新上报触发线（D-06）
    setCatStuck(false)
    catLineRef.current = null
  }, [])

  // 推入式整屏请求切 Tab（10b 轮：搜索空态「到设定页查看音源」胶囊 = 原型 closeSearch + switchTab('setting')
  // 两步的等价物）：发起屏投递后自行 pop 回来，本屏存活期间直收（见 utils/tabJump，不新造路由）
  useEffect(() => subscribeNewUiTab(selectTab), [selectTab])

  const handleSelect = useCallback(
    (key: string) => selectTab(key as NewUiTabKey),
    [selectTab],
  )

  // 原型点顶栏搜索框开搜索层（app.js openSearch）：全屏右推，自动聚焦输入
  const handleSearchPress = useCallback(() => {
    void pushNewUiSearch(componentId)
  }, [componentId])

  const Page = PAGES[tabKey]

  // 分类条原位纵坐标上报（页面 onLayout）：换算成吸顶触发线 —— 分类条顶边攀到顶栏下沿即该钉住，
  // 顶栏是 absolute 浮层不占滚动内容，故触发线 = catY - 顶栏高。
  const handleCatLayoutY = useCallback((y: number) => {
    catLineRef.current = y - topBarHeight(top)
  }, [top, topBarHeight])

  // 顶栏头像入口（原型 #topAvatar：手机端切「我的」）—— 提到 useCallback，
  // 否则每次 MainScreen 重渲染都给 TopBar 一个新函数，TopBar 的 memo 直接失效
  const handleAvatarPress = useCallback(() => selectTab('mine'), [selectTab])

  // 逐帧滚动偏移：只在布尔翻转时 setState，避免每帧重渲染主屏。
  const handleScrollOffset = useCallback((y: number) => {
    const line = catLineRef.current
    if (line == null) return
    setCatStuck(prev => {
      const next = y >= line
      return next === prev ? prev : next
    })
  }, [])

  // —— 页面子树的元素级 memo（2026-10-15 性能轮）——
  // pinned / catStuck / 各浮层显隐 / sourceDot 这些都是**主屏自己的**状态，与页面内容无关，
  // 但它们一变就重渲染 MainScreen：过去 `<Page/>` 是每次现建的新元素，于是整棵页面子树
  // 跟着重建（首页 = 轮播 + 十几张卡 + 二三十行 SongRow，每行又带 SVG 图标与封面；
  // 详情页同理由 FlatList 全量重挂可见行）。而 pinned 的触发线是 scrollTop > 8，
  // 等于**每次开始滚动的那一帧**必然炸一次重建 —— 这就是「滑动页面卡顿」的直接来源。
  // 这里把元素本身缓存住：引用的依赖全是稳定回调（上面逐个 useCallback）+ 当前页组件，
  // 主屏因吸顶态翻转而重渲染时，Page 元素引用不变，React 直接跳过整棵子树。
  // 主题切换不受影响：各页内部 useTheme 是 context 消费者，context 更新能穿透 memo 化的子树。
  const pageNode = useMemo(() => (
    <Page
      componentId={componentId}
      onSwitchTab={selectTab}
      onOpenSourceSheet={openSourceSheet}
      onOpenNameSheet={openNameSheet}
      onOpenMore={openMore}
      onOpenPlIdSheet={openPlIdSheet}
      onOpenPlTagsSheet={openPlTagsSheet}
      onOpenCreateListSheet={openCreateListSheet}
      onCatLayoutY={handleCatLayoutY}
      onOpenClearCacheConfirm={openClearCacheConfirm}
      onRegisterClearCache={registerClearCache}
      // 整页虚拟化的页（歌单页 2026-10-16 推荐池 OOM 轮 / 首页同轮第 2 站点）自带 PageListView
      // 滚动容器，顶栏 pinned / 分类条越线判定的滚动信号经这两个口直回主屏（走 PageViewport 的
      // 其余页忽略这组 prop，信号仍由下面共用的 PageViewport 供）；insets 供页面算顶栏留白与 Tab 栏净空
      onViewportPinnedChange={setPinned}
      onViewportScrollOffset={handleScrollOffset}
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
    openPlIdSheet,
    openPlTagsSheet,
    openCreateListSheet,
    handleCatLayoutY,
    openClearCacheConfirm,
    registerClearCache,
    handleScrollOffset,
    top,
    bottom,
  ])

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      {/* 自带滚动容器的页（歌单页 / 首页推荐池均已整页虚拟化）不再套 PageViewport——
          触底广播（emitPageEndReached）只对走 PageViewport 的页面有意义（usePageEndReached 总线），
          走自带容器的两页不经总线：歌单页的距底 160px 判定直连 pool.loadNextBatch，
          首页本就没有续取链路（总线唯一的订阅方是排行榜页，首页滚到底从来无人接，撤掉空转不改行为） */}
      {SELF_SCROLLING_TABS.includes(tabKey)
        ? pageNode
        : (
          <PageViewport
            key={tabKey}
            bottomInset={bottom}
            // 触底广播（第 7b 轮排行榜分批续取）：viewport 是其余三页（排行榜 / 我的 / 设定）共用的滚动容器，
            // 这里只负责「有人到底了」，谁处理由页面自己经 usePageEndReached 注册；
            // 触发线取原型的距底 160px（RANK_PAGING）
            endReachedDistance={RANK_PAGING.endReachedDistance}
            onEndReached={emitPageEndReached}
            onPinnedChange={setPinned}
            onScrollOffset={handleScrollOffset}
            topInset={top}
          >
            {pageNode}
          </PageViewport>
        )}
      {/* 歌单页分类条吸顶层（QA D-06）：挂在 PageViewport 之后、TopBar 之前 ——
          TopBar 更高的 JSX 序压在它的 paddingTop 空档上，视觉即「分类条贴住顶栏下沿」 */}
      {tabKey === 'playlist' && catStuck ? (
        <CatStickerBar topInset={top} onOpenPlTagsSheet={openPlTagsSheet} />
      ) : null }
      {/* 原型 .minibar：有曲目在放时浮在内容之上、Tab 栏之上（自身按播放态显隐）。
          形态按页面默认态走：只有首页给完整条，切到另外四个 Tab 自动收成磁吸圆点；
          resetKey = tabKey —— 手动在非首页展开过之后切页，按该页默认重置（原型 syncMiniPage）。
          推入层（搜索 / 歌单详情 / 已缓存 / 电台…）各自带一份挂点，本屏这一颗被它们整个盖住 */}
      <MinibarHost
        componentId={componentId}
        bottomInset={bottom}
        defaultSnapped={tabKey !== 'home'}
        resetKey={tabKey}
      />
      <TopBar
        avatarText={avatarText}
        avatarImageUri={avatarUri}
        onAvatarPress={handleAvatarPress}
        onSearchPress={handleSearchPress}
        searchPlaceholder={NEW_UI_SEARCH_PLACEHOLDER}
        sourceDot={sourceDot}
        // 原型 app.js L1585：顶栏波纹钮（#castBtn）= 手机端音源入口（侧栏 navFoot 的等价物，L1538 注释）
        onSourcePress={openSourceSheet}
        pinned={pinned}
        topInset={top}
      />
      <View style={styles.tabBarWrap}>
        <TabBar items={NEW_UI_TABS} activeKey={tabKey} bottomInset={bottom} onSelect={handleSelect} />
      </View>
      {/* LRC 浮窗不在这里挂（阶段 3，feature.md【newui】）：歌词浮窗是**系统级悬浮窗**
          （core/desktopLyric 的原生窗口，盖在 App 与其它应用之上），宿主不由 RN 屏幕承担，
          故 U61 那枚主屏内可拖动气泡（screens/Main/LrcFloatDock + hooks/useLrcFloat）整体下线；
          入口在播放页工具行（screens/Player 的 #btnFloat），原型视觉件留在 components/LrcFloat 待用。
          —— 以下浮层按原型 z-index 排在最后：sheet 80、toast 90 */}
      {/* 音源设置浮层：根层最后子视图，盖过 Tab 栏（原型 .sheet z-index 80 > .tabbar 46） */}
      <SourceSheet
        visible={sourceSheetVisible}
        onClose={closeSourceSheet}
        bottomInset={bottom}
      />
      {/* 「修改」浮层（原型 #nameSheet，昵称 + 头像）：与音源浮层同层，后挂载者盖其上 */}
      <NameSheet
        visible={nameSheetVisible}
        onClose={closeNameSheet}
        bottomInset={bottom}
      />
      {/* 单曲操作面板（原型 #moreSheet）：主屏内歌曲行 ⋯ 的目标曲都在这里 */}
      <MoreSheet
        visible={moreMusic != null}
        musicInfo={moreMusic}
        onClose={closeMore}
        bottomInset={bottom}
      />
      {/* 打开歌单浮层（原型 #plIdSheet）：歌单页页头「按链接打开」胶囊入口，与其余浮层同层 */}
      <PlIdSheet
        visible={plIdSheetVisible}
        onClose={closePlIdSheet}
        componentId={componentId}
        bottomInset={bottom}
      />
      {/* 全部分类浮层：歌单页 chip 行末尾「全部分类」入口；选中分类后经共享模块回流页面与推荐池 */}
      <PlTagsSheet
        visible={plTagsSheetVisible}
        onClose={closePlTagsSheet}
        bottomInset={bottom}
      />
      {/* 新建歌单浮层（2026-10-13 bug-fix「我的」7a）：我的页「我的歌单」右上角入口，与其余浮层同层 */}
      <CreateListSheet
        visible={createListSheetVisible}
        onClose={closeCreateListSheet}
        bottomInset={bottom}
      />
      {/* 「清除缓存」二次确认（原型 askClearCache → askConfirm，app.js L1382-1397；第 13 轮换掉
          设定页残留的系统弹窗）。标题不传 → 共通件回落原型默认句「要执行这一步吗」；
          正文/按钮文案取自 const/setting（逐字对照原型 body / okLabel），清除本体仍在 SettingPage */}
      <ConfirmSheet
        visible={clearCacheConfirmVisible}
        body={NEW_UI_SETTING_LABELS.clearConfirm}
        okLabel={NEW_UI_SETTING_LABELS.clearConfirmButton}
        onConfirm={confirmClearCache}
        onClose={closeClearCacheConfirm}
        bottomInset={bottom}
      />
      {/* 提示胶囊（QA D-09）：根层最后一子——原型 .toast z-index:90 压过浮层 */}
      <NewUiToastHost bottomInset={bottom} />
    </View>
  )
}

MainScreen.displayName = 'NewUIMainScreen'

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** .tabbar position:absolute bottom 0（z-index 46） */
  tabBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
})
