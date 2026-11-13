import { memo, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import {
  CONTROL,
  FONT_SIZE,
  FONT_WEIGHT,
  LAYOUT,
  LETTER_SPACING,
  SPACING,
  useTheme,
} from '@/newui/theme'

import { Icon } from '../Icon'

export interface SectionProps {
  /** 区块标题（.section-title 19px）；原型部分区块无页头（如首页「每日推荐」），此时不传 */
  title?: string
  /** 小标题形态（.section-sub 16px），用于「我的歌单」这类二级区块 */
  sub?: boolean
  /** 右侧动作文案（「全部歌单」「清空记录」）；不传则不渲染 */
  more?: string
  onMorePress?: () => void
  /**
   * 右侧自定义件（原型 `.section-head` 里非「更多」的右件，如歌单池的 `.pl-count`）；
   * 传了就顶替 more 的位置，两者互斥由容器保证。
   */
  right?: ReactNode
  /** 区块内容（卡片行 / 列表等） */
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * 区块骶架（对应原型 .section / .section-head）：可选标题 + 可选右侧「更多」+ 内容。
 * 页面区块一律走它，26px 区块间距与 12px 头部间距由 token 统一；
 * 两者都没传时只保留区块间距（原型 `.section > .daily-card` 那种无页头情式）。
 */
export const Section = memo(
  ({ title, sub = false, more, onMorePress, right, children, style }: SectionProps) => {
    const theme = useTheme()
    const showHead = title != null || more != null || right != null
    return (
      <View style={[styles.root, style]}>
        {showHead && (
          <View style={styles.head}>
            {title != null && (
              <Text
                numberOfLines={1}
                style={[sub ? styles.subTitle : styles.title, { color: theme.colors.text }]}
              >
                {title}
              </Text>
            )}
            {right != null
              ? right
              : more != null && (
                <Pressable onPress={onMorePress} style={styles.more} hitSlop={CONTROL.moreHitSlop}>
                  {({ pressed }) => (
                    <>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.moreText,
                          { color: pressed ? theme.colors.text2 : theme.colors.text3 },
                        ]}
                      >
                        {more}
                      </Text>
                      <Icon
                        name="chevron"
                        size={CONTROL.moreIconSize}
                        color={pressed ? theme.colors.text2 : theme.colors.text3}
                        style={styles.moreIcon}
                      />
                    </>
                  )}
                </Pressable>
              )}
          </View>
        )}
        {children}
      </View>
    )
  },
)

Section.displayName = 'NewUISection'

const styles = StyleSheet.create({
  /** .section margin-top:26px */
  root: {
    marginTop: LAYOUT.sectionGap,
  },
  /** .section-head：CSS 为 baseline 对齐，RN 以 center 近似（图文混排视觉差异极小） */
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  /** .section-title 19px / 800 */
  title: {
    flexShrink: 1,
    fontSize: FONT_SIZE.headingLg,
    fontWeight: FONT_WEIGHT.extraBold,
    letterSpacing: LETTER_SPACING.tight,
  },
  /** .section-sub 16px / 800 */
  subTitle: {
    flexShrink: 1,
    fontSize: FONT_SIZE.headingSm,
    fontWeight: FONT_WEIGHT.extraBold,
    letterSpacing: LETTER_SPACING.tight,
  },
  /** .section-more：12.5px 文字 + 13px 箭头（gap 1px） */
  more: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: CONTROL.moreGap,
  },
  moreText: {
    fontSize: FONT_SIZE.smallLg,
  },
  moreIcon: {
    opacity: CONTROL.moreIconOpacity,
  },
})
