import { memo, type ReactNode } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { FONT_SIZE, FONT_WEIGHT, LETTER_SPACING, PAGE_HEAD, useTheme } from '@/newui/theme'

export interface PageHeaderProps {
  /** 大标题（原型 .page-title：歌单 / 排行榜 / 设定） */
  title: string
  /** 右侧动作区（原型 .page-head 内的 .pl-open-btn 等），不传则标题独占一行 */
  after?: ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * 页面大标题栏（对应原型 .page-head / .page-title）。
 * 24px / 900 字重是页面级标题，与 Section 的 19px 区块标题分层。
 */
export const PageHeader = memo(({ title, after, style }: PageHeaderProps) => {
  const theme = useTheme()
  return (
    <View style={[styles.root, style]}>
      <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      {after}
    </View>
  )
})

PageHeader.displayName = 'NewUIPageHeader'

const styles = StyleSheet.create({
  /** .page-head：space-between / gap 12 / margin-top 6 */
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: PAGE_HEAD.gap,
    marginTop: PAGE_HEAD.marginTop,
  },
  /** .page-title：24px / 900 / .4 字距 */
  title: {
    flexShrink: 1,
    fontSize: FONT_SIZE.displayLg,
    fontWeight: FONT_WEIGHT.black,
    letterSpacing: LETTER_SPACING.wide,
  },
})
