import { memo, type ReactNode } from 'react'
import {
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { LAYOUT, TAB_BAR } from '@/newui/theme'
// 直连具体 hook：components 处于 screens 下层，走桶口会把类型依赖整摞拖进来
import { useWideLayout } from '@/newui/hooks/useWideLayout'

import { useViewportScroll } from './useViewportScroll'

export interface PageViewportProps {
  children: ReactNode
  /** 状态栏高度（TopBar 覆盖其上，内容上留白需等于顶栏总高） */
  topInset?: number
  /** 底部安全区，与 Tab 栏一同叠在内容留白之下 */
  bottomInset?: number
  /** 吸顶状态变化；只在跨越阈值时回调一次，避免每帧刷新父组件 */
  onPinnedChange?: (pinned: boolean) => void
  /** 触底回调（分批续取）。不传 = 不启用；像素判定见 useViewportScroll */
  onEndReached?: () => void
  /** 距底触发线（px），仅在传了 onEndReached 时生效；0 = 触到最底才发 */
  endReachedDistance?: number
  contentContainerStyle?: StyleProp<ViewStyle>
}

/**
 * 页面滚动容器（ScrollView 形态）。
 * 左右 16px 内边距、上留白等于顶栏总高、下留白为 Tab 栏之上净空 + Tab 栏 + 安全区；
 * 切 Tab 时父组件用 key 重挂载即可复位 scrollTop。
 * 两项滚动计量（吸顶 / 触底）收敛在 useViewportScroll，与 PageListView 同源同口径。
 * 宽屏档内容盒限宽 620 并居中、上下内衬换成宽屏值；竖屏档全部回基线，逐值零变化。
 */
export const PageViewport = memo(
  ({ children, topInset = 0, bottomInset = 0, onPinnedChange, onEndReached, endReachedDistance = 0, contentContainerStyle }: PageViewportProps) => {
    const scrollHandlers = useViewportScroll({ onPinnedChange, onEndReached, endReachedDistance })
    const { boxStyle, wide, topBarHeight } = useWideLayout()

    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          {
            // 上内衬 = 本档顶栏总高
            paddingTop: topBarHeight(topInset),
            // 下内衬 = Tab 栏之上净空 + Tab 栏高 + 安全区（宽屏 84+44，竖屏 86+60）
            paddingBottom:
              (wide?.contentGapAboveTabBar ?? LAYOUT.contentGapAboveTabBar) +
              (wide?.tabBarHeight ?? TAB_BAR.height) +
              bottomInset,
          },
          boxStyle,
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        {...scrollHandlers}
      >
        {children}
      </ScrollView>
    )
  },
)

PageViewport.displayName = 'NewUIPageViewport'

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: LAYOUT.screenPaddingX,
  },
})
