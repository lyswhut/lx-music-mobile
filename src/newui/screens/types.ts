import type { NewUiTabKey } from '@/newui/const'

/**
 * 主页面（Tab 页）的统一 props 契约。
 * 首页的快捷入口、区块右侧「全部歌单 / 完整榜单」都要切 Tab，
 * 所以 MainScreen 无条件把 onSwitchTab 注入每一页，页面按需取用。
 * componentId 同样无条件注入：部分入口要 push 项目既有的 RNN 页面
 * （播放详情、歌单详情），需要挂载点的屏幕 ID。
 */
export interface NewUiPageProps {
  /** react-native-navigation 主屏 ID，用于 push 既有路由页面 */
  componentId: string
  onSwitchTab: (key: NewUiTabKey) => void
  /** 打开音源设置浮层（浮层本体挂在 MainScreen 根层，9d）；首页音源公告轮播卡入口 */
  onOpenSourceSheet?: () => void
  /** 打开改昵称浮层（浮层本体挂在 MainScreen 根层，9e）；我的页「改昵称」胶囊入口（原型 #mineEdit，app.js L1591） */
  onOpenNameSheet?: () => void
  /** 打开单曲操作面板（浮层本体挂在 MainScreen 根层，9e）；歌曲行 more 钮入口（原型 songRow 的 ⋯，app.js L307-312） */
  onOpenMore?: (musicInfo: LX.Music.MusicInfo) => void
  /** 打开「打开歌单」浮层（浮层本体挂在 MainScreen 根层，9f）；歌单页页头「按链接打开」胶囊入口（原型 #plOpenBtn，app.js L1597） */
  onOpenPlIdSheet?: () => void
  /** 打开「全部分类」浮层（浮层本体挂在 MainScreen 根层）；歌单页 chip 行末尾入口胶囊 */
  onOpenPlTagsSheet?: () => void
  /** 打开「新建歌单」浮层（浮层本体挂在 MainScreen 根层，2026-10-13 bug-fix「我的」7a）；我的页「我的歌单」区块右上角入口 */
  onOpenCreateListSheet?: () => void
  /**
   * 歌单页分类条在滚动内容里的纵坐标上报（QA 2026-10-14 D-06 吸顶）：
   * 主屏据此计算「分类条越过顶栏下沿」的时机，切换根层 CatStickerBar 的显隐。
   */
  onCatLayoutY?: (y: number) => void
  /** 打开「清除缓存」二次确认浮层（浮层本体挂在 MainScreen 根层，QA 2026-10-14 第 13 轮：
   * 设定页在 PageViewport 滚动内容里，自挂 absolute 浮层会错位 → 与其余浮层同款上抛根层单实例） */
  onOpenClearCacheConfirm?: () => void
  /** 设定页把「真清除」动作注册给主屏（ConfirmSheet 右键按下时由根层容器执行）；卸载传 null 注销 */
  onRegisterClearCache?: (action: (() => void) | null) => void
  /**
   * —— 页面自带滚动容器时的吸顶链路回传（2026-10-16 歌单页推荐池虚拟化轮，
   * 同轮第 2 站点首页沿用同一组口）——
   * 歌单页 / 首页的推荐池改整页虚拟化列表（PageListView）后，页面不再套在主屏 PageViewport 里；
   * 顶栏 pinned 与分类条吸顶（CatStickerBar）的越线判定仍要拿到滚动信号，由这两个口直回主屏。
   * 其余 Tab 页继续走主屏共用的 PageViewport，这四个 prop 不下发语义、保持 undefined。
   */
  onViewportPinnedChange?: (pinned: boolean) => void
  onViewportScrollOffset?: (y: number) => void
  /** 状态栏高度：自带滚动容器的页面算顶栏总留白（topbarHeight）用，与 PageViewport.topInset 同源 */
  viewportTopInset?: number
  /** 底部安全区：自带滚动容器的页面垫 Tab 栏净空用，与 PageViewport.bottomInset 同源 */
  viewportBottomInset?: number
}
