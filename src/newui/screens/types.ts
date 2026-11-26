import type { NewUiTabKey } from '@/newui/const'

/**
 * 主页面（Tab 页）的统一 props 契约：切换 Tab、push 既有 RNN 页面所需的主屏 ID 都由 MainScreen 无条件注入。
 */
export interface NewUiPageProps {
  /** react-native-navigation 主屏 ID，用于 push 既有路由页面 */
  componentId: string
  onSwitchTab: (key: NewUiTabKey) => void
  /** 打开音源设置浮层（浮层挂在 MainScreen 根层） */
  onOpenSourceSheet?: () => void
  /** 打开改昵称浮层（浮层挂在 MainScreen 根层）；我的页「改昵称」入口 */
  onOpenNameSheet?: () => void
  /** 打开单曲操作面板（浮层挂在 MainScreen 根层）；歌曲行 more 钮入口 */
  onOpenMore?: (musicInfo: LX.Music.MusicInfo) => void
  /** 打开「全部分类」浮层（浮层挂在 MainScreen 根层）；歌单页 chip 行末尾入口 */
  onOpenPlTagsSheet?: () => void
  /** 打开「新建歌单」浮层（浮层挂在 MainScreen 根层）；我的页「我的歌单」区块右上角入口 */
  onOpenCreateListSheet?: () => void
  /** 打开「清除缓存」二次确认浮层（挂在 MainScreen 根层单实例：设定页在滚动内容里自挂 absolute 会错位） */
  onOpenClearCacheConfirm?: () => void
  /** 设定页把「真清除」动作注册给主屏（ConfirmSheet 右键按下时由根层容器执行）；卸载传 null 注销 */
  onRegisterClearCache?: (action: (() => void) | null) => void
  /**
   * 页面自带滚动容器（歌单页 PageListView）时把顶栏 pinned 的滚动信号直回主屏；
   * 其余 Tab 页走主屏共用的 PageViewport，不用这个口。
   */
  onViewportPinnedChange?: (pinned: boolean) => void
  /** 状态栏高度：自带滚动容器的页面算顶栏总留白用，与 PageViewport.topInset 同源 */
  viewportTopInset?: number
  /** 底部安全区：自带滚动容器的页面垫 Tab 栏净空用，与 PageViewport.bottomInset 同源 */
  viewportBottomInset?: number
}
