import { forwardRef, useState } from 'react'
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { usePressFx } from '@/newui/hooks/usePressFx'
import {
  FONT_SIZE,
  FONT_WEIGHT,
  GRADIENTS,
  OP_BOX,
  SHADOW,
  useTheme,
} from '@/newui/theme'

/** 按压反馈必须作用在 Pressable 本体，套 Animated.View 会改掉 flex 布局 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface OpInputRowProps {
  value: string
  onChangeText: (text: string) => void
  /** 输入提示语 */
  placeholder: string
  /** 主按钮文案 */
  goLabel: string
  onGo: () => void
  /** 进行中：按钮换 busyLabel、输入与按钮都不可再触发 */
  busy?: boolean
  busyLabel?: string
  maxLength?: number
  keyboardType?: TextInputProps['keyboardType']
  autoCapitalize?: TextInputProps['autoCapitalize']
  autoCorrect?: boolean
  /** 挂载即聚焦（Sheet 只在可见时挂载子件，autoFocus 时机正合适） */
  autoFocus?: boolean
  onSubmitEditing?: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * 浮层「输入 + 主色按钮」行，供各 Sheet 复用；token 全走 OP_BOX / GRADIENTS.brand。
 * ref 转发到 TextInput，由容器掌握聚焦时机。
 */
export const OpInputRow = forwardRef<TextInput, OpInputRowProps>(({
  value,
  onChangeText,
  placeholder,
  goLabel,
  onGo,
  busy = false,
  busyLabel,
  maxLength,
  keyboardType,
  autoCapitalize = 'none',
  autoCorrect = false,
  autoFocus,
  onSubmitEditing,
  style,
}, ref) => {
  const theme = useTheme()
  // 聚焦态切换主色描边与底色
  const [focused, setFocused] = useState(false)
  /**
   * 主按钮按压：缩放 0.955、时长 160（本族最快一档）。
   * busy 时不可触发：缩放收到 1，只留整枚压暗。
   */
  const goFx = usePressFx({ scale: busy ? 1 : OP_BOX.goPressScale, duration: OP_BOX.goPressMs })
  return (
    <View style={[styles.root, style]}>
      <TextInput
        ref={ref}
        style={[
          styles.input,
          {
            backgroundColor: focused ? theme.colors.fill3 : theme.colors.fill2,
            borderColor: focused ? theme.colors.brand : theme.colors.line,
            color: theme.colors.text,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text3}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!busy}
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
      />
      <AnimatedPressable
        accessibilityRole="button"
        onPress={busy ? undefined : onGo}
        onPressIn={goFx.onPressIn}
        onPressOut={goFx.onPressOut}
        style={[
          styles.go,
          SHADOW.playerMain,
          goFx.animatedStyle,
          busy && styles.goBusy,
        ]}
      >
        <LinearGradient
          colors={[...GRADIENTS.brand.colors]}
          start={GRADIENTS.brand.start}
          end={GRADIENTS.brand.end}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.goText, { color: theme.colors.onGradient }]}>
          {busy && busyLabel != null ? busyLabel : goLabel}
        </Text>
      </AnimatedPressable>
    </View>
  )
})

OpInputRow.displayName = 'NewUIOpInputRow'

const styles = StyleSheet.create({
  /** 输入框 + 按钮横排 */
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OP_BOX.gap,
  },
  /** 输入框 */
  input: {
    flex: 1,
    minWidth: 0,
    height: OP_BOX.height,
    borderRadius: OP_BOX.inputRadius,
    paddingHorizontal: OP_BOX.inputPaddingX,
    // 常态 1px / focus 1.5px；RN 改宽会抖，恒取 focus 档
    borderWidth: OP_BOX.focusRingWidth,
    fontSize: FONT_SIZE.bodyLg,
  },
  /** 主色按钮 */
  go: {
    flexShrink: 0,
    height: OP_BOX.height,
    paddingHorizontal: OP_BOX.goPaddingX,
    borderRadius: OP_BOX.goRadius,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  goBusy: {
    opacity: 0.6,
  },
  goText: {
    fontSize: FONT_SIZE.bodyLg,
    fontWeight: FONT_WEIGHT.extraBold,
  },
})
