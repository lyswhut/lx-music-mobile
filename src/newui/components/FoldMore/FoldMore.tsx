import { memo } from 'react'
import { Animated, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'

import { usePressFx } from '@/newui/hooks/usePressFx'
import { FOLD_MORE, FONT_WEIGHT, useTheme } from '@/newui/theme'

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface FoldMoreProps {
  /** 整行文案（如「还有 N 个音源没显示 · 点这里看全」） */
  text: string
  /** 按下展开（与标题行右侧开关同一动作） */
  onPress: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * 折叠列表的尾行：收起时替看不见的行说一句，整行可点。
 * 底色比行本体再降一档，不能长得像普通选项行。纯展示件，条数由容器算后写入 text。
 */
export const FoldMore = memo(({ text, onPress, style }: FoldMoreProps) => {
  const theme = useTheme()
  // 按压缩放 .99、底色 fill1 → fill3
  const pressFx = usePressFx({
    scale: FOLD_MORE.pressScale,
    background: { from: theme.colors.fill1, to: theme.colors.fill3 },
  })
  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={pressFx.onPressIn}
      onPressOut={pressFx.onPressOut}
      style={[styles.root, { borderColor: theme.colors.hairline }, pressFx.animatedStyle, style]}
    >
      <Text style={[styles.text, { color: theme.colors.text3 }]}>{text}</Text>
    </AnimatedPressable>
  )
})

FoldMore.displayName = 'NewUIFoldMore'

const styles = StyleSheet.create({
  root: {
    width: '100%',
    paddingVertical: FOLD_MORE.paddingY,
    paddingHorizontal: FOLD_MORE.paddingX,
    borderRadius: FOLD_MORE.radius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: FOLD_MORE.fontSize,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
  },
})
