import { memo, type ReactNode } from 'react'
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

import { H_SCROLL, LAYOUT } from '@/newui/theme'

export interface HScrollProps {
  /** 横滑卡片；单卡宽度由卡片自身按 token 固定 */
  children: ReactNode
  contentContainerStyle?: StyleProp<ViewStyle>
}

/**
 * 通栏横滑容器：用负外边距让卡片贴屏边滑动，内边距补回首个卡片的起始位置。
 */
export const HScroll = memo(({ children, contentContainerStyle }: HScrollProps) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.root}
    contentContainerStyle={[styles.content, contentContainerStyle]}
  >
    {children}
  </ScrollView>
))

HScroll.displayName = 'NewUIHScroll'

const styles = StyleSheet.create({
  root: {
    marginHorizontal: -LAYOUT.screenPaddingX,
  },
  content: {
    gap: H_SCROLL.gap,
    paddingHorizontal: LAYOUT.screenPaddingX,
    paddingBottom: H_SCROLL.paddingBottom,
  },
})
