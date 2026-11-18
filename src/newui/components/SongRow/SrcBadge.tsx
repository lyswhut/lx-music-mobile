import { memo } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { CONTROL, FONT_SIZE, FONT_WEIGHT, LETTER_SPACING, RADIUS } from '@/newui/theme'
import { withAlpha } from '@/newui/utils'

export interface SrcBadgeProps {
  /** 平台简称（SOURCES[x].short） */
  label: string
  /** 平台 tint 色（PLATFORM_TINTS） */
  tint: string
  style?: StyleProp<ViewStyle>
}

/**
 * 来源平台角标（对应原型 .src-badge）：
 * tint 色文字 + 16% tint 底 + 34% tint 描边（color-mix 的预计算等价）。
 * 目前仅歌曲行使用；如他处再出现同一视觉，再提升为公共组件。
 */
export const SrcBadge = memo(({ label, tint, style }: SrcBadgeProps) => (
  <View
    style={[
      styles.root,
      { backgroundColor: withAlpha(tint, 0.16), borderColor: withAlpha(tint, 0.34) },
      style,
    ]}
  >
    <Text numberOfLines={1} style={[styles.text, { color: tint }]}>
      {label}
    </Text>
  </View>
))

SrcBadge.displayName = 'NewUISrcBadge'

const styles = StyleSheet.create({
  root: {
    flexShrink: 0,
    alignSelf: 'center',
    paddingHorizontal: CONTROL.badgePaddingX,
    paddingVertical: CONTROL.badgePaddingY,
    borderRadius: RADIUS.tagXs,
    borderWidth: 1,
  },
  text: {
    fontSize: FONT_SIZE.micro,
    fontWeight: FONT_WEIGHT.extraBold,
    letterSpacing: LETTER_SPACING.tight,
  },
})
