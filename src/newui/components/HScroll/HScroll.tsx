import { memo, type ReactNode } from 'react'
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

import { H_SCROLL, LAYOUT } from '@/newui/theme'

export interface HScrollProps {
  /** 卡片（RecentCard / 歌手卡 / 我的歌单卡）；单卡宽度由卡片自身按 token 固定 */
  children: ReactNode
  contentContainerStyle?: StyleProp<ViewStyle>
}

/**
 * 通栏横滑容器（对应原型 .hscroll，styles.css L200）。
 * 用负外边距抵消页面 16px 内边距让卡片贴屏边滑动，内边距补回首个卡片的起始位置。
 * 首页「继续收听」、歌单页「我的歌单」、榜单卡池等横滑排共用此件。
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
  /** margin:0 -16px */
  root: {
    marginHorizontal: -LAYOUT.screenPaddingX,
  },
  /** padding-left/right 16px + padding-bottom 2px + gap 12px */
  content: {
    gap: H_SCROLL.gap,
    paddingHorizontal: LAYOUT.screenPaddingX,
    paddingBottom: H_SCROLL.paddingBottom,
  },
})
