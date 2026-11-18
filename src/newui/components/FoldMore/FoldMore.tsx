import { memo } from 'react'
import { Animated, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'

import { usePressFx } from '@/newui/hooks/usePressFx'
import { FOLD_MORE, FONT_WEIGHT, useTheme } from '@/newui/theme'

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface FoldMoreProps {
  /** 整行文案（原型 renderSheet L2285：「还有 N 个音源没显示 · 点这里看全（其中 M 个已就绪）」） */
  text: string
  /** 按下展开（原型 more.onclick：与标题行右那颗开关做的是同一件事，两条入口都通向展开） */
  onPress: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * 折叠列表的尾行（对应原型 .fold-more，styles.css L784-787，件 parts/common-control/opt-list.css L51-55）：
 * 收起态时替「看不见的那几行」说一句，整行可点。底色比行本体再降一档（fill-1，
 * 件 L51-53 —— 它不是选项，是列表的尾巴，所以不能长得像 .opt-row）。
 * 纯展示件：藏了几条、里面有几份已就绪，都由容器算好后写进 text。
 */
export const FoldMore = memo(({ text, onPress, style }: FoldMoreProps) => {
  const theme = useTheme()
  // `.fold-more:active{background:var(--fill-3);transform:scale(.99)}`（件 opt-list.css L55），
  // 过渡 `.2s var(--ease)`（件 L54）→ MOTION.fast 缺省档；常态底 fill-1，故 from 给常态色
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
  /** .fold-more：整宽 / padding 9 12 / 圆角 13 / 居中对齐 */
  root: {
    width: '100%',
    paddingVertical: FOLD_MORE.paddingY,
    paddingHorizontal: FOLD_MORE.paddingX,
    borderRadius: FOLD_MORE.radius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** 11.5 / 700 / 居中 */
  text: {
    fontSize: FOLD_MORE.fontSize,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
  },
})
