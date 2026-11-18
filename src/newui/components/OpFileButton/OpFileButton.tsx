import { memo } from 'react'
import { Animated, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'

import { usePressFx } from '@/newui/hooks/usePressFx'
import { FONT_SIZE, FONT_WEIGHT, OP_FILE, useTheme } from '@/newui/theme'

import { Icon, type IconName } from '../Icon'

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface OpFileButtonProps {
  /** 钮面文字（原型 #importFileLabel：闲时「从本机选择一份音源文件」，进行中由容器换成「正在读取…」） */
  label: string
  onPress: () => void
  /** 进行中：不可再触发（原型 renderImportRow L2429 只换文案，真实侧还要挡住连点） */
  busy?: boolean
  /** 钮首图标（原型件里是 #i-plus，缺件时保持默认） */
  icon?: IconName
  style?: StyleProp<ViewStyle>
}

/**
 * 「从本机选一个文件」整宽次级钮（对应原型 .op-file，styles.css L813-817，件 parts/common-control/op-box.css L31-37）。
 * 原型那枚 label 里裹着一个 `input[type=file]`（#importFile，件 L10 干脆 display:none），
 * RN 侧这一档的等价物是系统选取器（AndroidScoped.openDocument，utils/fs.ts L27 的 selectFile）——
 * 钮本身只负责长得像件里那一枚：比 .op-go 降一档（无渐变、无投影、字小半号、text-2 墨色）。
 * 纯展示件：选哪个类型、读到什么、成功失败说什么，全在容器（SourceSheet）。
 */
export const OpFileButton = memo(({ label, onPress, busy = false, icon = 'plus', style }: OpFileButtonProps) => {
  const theme = useTheme()
  /**
   * `.op-file:active{background:var(--fill-3);transform:scale(.99)}`（件 op-box.css L35），
   * 过渡 `.2s var(--ease)`（件 L34）→ MOTION.fast 缺省档；常态底 fill-2，故 from 给常态色。
   * 进行中（busy）不可再触发：缩放与底色两档都收掉，只留整枚压暗。
   */
  const pressFx = usePressFx({
    scale: busy ? 1 : OP_FILE.pressScale,
    background: busy ? undefined : { from: theme.colors.fill2, to: theme.colors.fill3 },
  })
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={busy ? undefined : onPress}
      onPressIn={pressFx.onPressIn}
      onPressOut={pressFx.onPressOut}
      style={[
        styles.root,
        { borderColor: theme.colors.hairline },
        // busy 时底色恒为常态色（上面的 background 档已收掉，这里补上静态底）
        busy && { backgroundColor: theme.colors.fill2 },
        pressFx.animatedStyle,
        busy && styles.busy,
        style,
      ]}
    >
      <Icon name={icon} size={OP_FILE.iconSize} color={theme.colors.text2} />
      <Text style={[styles.text, { color: theme.colors.text2 }]} numberOfLines={1}>{label}</Text>
    </AnimatedPressable>
  )
})

OpFileButton.displayName = 'NewUIOpFileButton'

const styles = StyleSheet.create({
  /** .op-file：整宽 / 高 40 / 圆角 13 / 居中 / 图文间距 6（margin-top 由调用方给，见 OP_FILE.marginTop） */
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: OP_FILE.gap,
    height: OP_FILE.height,
    borderRadius: OP_FILE.radius,
    borderWidth: 1,
  },
  busy: {
    opacity: 0.6,
  },
  /** 13 / 700 */
  text: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.bold,
  },
})
