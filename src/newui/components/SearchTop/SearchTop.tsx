import { forwardRef } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { FONT_SIZE, FONT_WEIGHT, SEARCH, useTheme } from '@/newui/theme'
// 直连具体 hook（不走 @/newui/hooks 桶口）
import { useWideLayout } from '@/newui/hooks/useWideLayout'
import { withAlpha } from '@/newui/utils'

import { Icon } from '../Icon'

export interface SearchTopProps {
  /** 输入框当前文本（受控） */
  value: string
  /** 聚焦态：底加深 + 主色亮环 */
  focused: boolean
  /** 状态栏实测高度 */
  topInset: number
  /** 输入提示 */
  placeholder: string
  /** 「取消」文案 */
  cancelLabel: string
  /** 清除钮无障碍文案 */
  clearLabel: string
  onChangeText: (value: string) => void
  onFocus: () => void
  onBlur: () => void
  /** 回车提交（键盘搜索键） */
  onSubmit: () => void
  onClear: () => void
  onCancel: () => void
}

/**
 * 搜索层头排：放大镜 + 输入框（有字才现身清除圆点）+「取消」；聚焦时换深底 + 半透明主色亮环。
 * 纯展示组件：文本、聚焦态与回调由容器传入；ref 转发到 TextInput（清空后要回焦）。
 */
export const SearchTop = forwardRef<TextInput, SearchTopProps>(({
  value,
  focused,
  topInset,
  placeholder,
  cancelLabel,
  clearLabel,
  onChangeText,
  onFocus,
  onBlur,
  onSubmit,
  onClear,
  onCancel,
}, ref) => {
  const theme = useTheme()
  // 顶排上内衬按档走：宽屏档状态栏 + 4，竖屏回 SEARCH.statusBarReserve；左右与底两档同值
  const { wide } = useWideLayout()
  return (
    <View style={[styles.top, { paddingTop: topInset + (wide?.statusReserve ?? SEARCH.statusBarReserve) }]}>
      <View
        style={[
          styles.box,
          {
            backgroundColor: focused
              ? theme.colors.fill3
              : theme.colors.fill2,
            borderColor: focused
              ? withAlpha(theme.colors.brand, SEARCH.focusRingAlpha)
              : theme.colors.line,
            borderWidth: focused ? SEARCH.focusRingWidth : 1,
          },
        ]}
      >
        <Icon name="search" size={SEARCH.boxIcon} color={theme.colors.text3} />
        <TextInput
          ref={ref}
          style={[styles.input, { color: theme.colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text3}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          autoFocus
          clearButtonMode="never"
          selectionColor={theme.colors.brand}
          accessibilityLabel={placeholder}
        />
        {/* 有输入才出现的清除圆点 */}
        {value.length > 0 && (
          <Pressable
            onPress={onClear}
            style={[styles.clear, { backgroundColor: theme.colors.fill4 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={clearLabel}
          >
            <Icon name="close" size={SEARCH.clearIcon} color={theme.colors.text2} />
          </Pressable>
        )}
      </View>
      <Pressable
        onPress={onCancel}
        style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={cancelLabel}
      >
        <Text style={[styles.cancelText, { color: theme.colors.text2 }]}>
          {cancelLabel}
        </Text>
      </Pressable>
    </View>
  )
})

SearchTop.displayName = 'NewUISearchTop'

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SEARCH.gap,
    paddingHorizontal: SEARCH.paddingX,
    paddingBottom: SEARCH.paddingBottom,
  },
  box: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SEARCH.boxGap,
    height: SEARCH.boxHeight,
    borderRadius: SEARCH.boxRadius,
    paddingHorizontal: SEARCH.boxPaddingX,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    fontSize: FONT_SIZE.title,
    fontWeight: FONT_WEIGHT.medium,
  },
  clear: {
    width: SEARCH.clearSize,
    height: SEARCH.clearSize,
    borderRadius: SEARCH.clearSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cancel: {
    paddingVertical: SEARCH.cancelPaddingY,
    paddingHorizontal: 2,
  },
  cancelText: {
    fontSize: FONT_SIZE.bodyLg,
    fontWeight: FONT_WEIGHT.semibold,
  },
  pressed: {
    opacity: 0.7,
  },
})
