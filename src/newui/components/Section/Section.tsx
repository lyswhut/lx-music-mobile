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
  /** 区块标题；部分区块无页头（如「每日推荐」），此时不传 */
  title?: string
  /** 小标题形态，用于「我的歌单」这类二级区块 */
  sub?: boolean
  /** 右侧动作文案（「全部歌单」「清空记录」）；不传则不渲染 */
  more?: string
  onMorePress?: () => void
  /**
   * 右侧自定义件（如歌单池的计数）；传了就顶替 more 的位置，两者互斥由容器保证。
   */
  right?: ReactNode
  /** 区块内容 */
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * 区块骨架：可选标题 + 可选右侧「更多」+ 内容。
 * 区块间距与头部间距由 token 统一；标题与右件都没传时只保留区块间距。
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
  root: {
    marginTop: LAYOUT.sectionGap,
  },
  /** CSS 为 baseline 对齐，RN 以 center 近似 */
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  title: {
    flexShrink: 1,
    fontSize: FONT_SIZE.headingLg,
    fontWeight: FONT_WEIGHT.extraBold,
    letterSpacing: LETTER_SPACING.tight,
  },
  subTitle: {
    flexShrink: 1,
    fontSize: FONT_SIZE.headingSm,
    fontWeight: FONT_WEIGHT.extraBold,
    letterSpacing: LETTER_SPACING.tight,
  },
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
