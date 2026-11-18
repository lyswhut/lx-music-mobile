import { forwardRef } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { FONT_SIZE, FONT_WEIGHT, SEARCH, useTheme } from '@/newui/theme'
// 直连具体 hook（不走 @/newui/hooks 桶口），与 PageViewport / TabBar 同一做法
import { useWideLayout } from '@/newui/hooks/useWideLayout'
import { withAlpha } from '@/newui/utils'

import { Icon } from '../Icon'

export interface SearchTopProps {
  /** 输入框当前文本（受控，容器持 state） */
  value: string
  /** 聚焦态（.sc-box:focus-within：底加深 + 主色亮环；容器持 state） */
  focused: boolean
  /** 状态栏实测高度（.sc-top padding-top 54 里超出的那截由本件补 SEARCH.statusBarReserve） */
  topInset: number
  /** 输入提示（.sc-input placeholder，容器传 const NEW_UI_SEARCH_INPUT_PLACEHOLDER） */
  placeholder: string
  /** 「取消」文案（.sc-cancel） */
  cancelLabel: string
  /** 清除钮无障碍文案（.sc-x 只有图形，需口头说明用途） */
  clearLabel: string
  onChangeText: (value: string) => void
  onFocus: () => void
  onBlur: () => void
  /** 回车提交（.sc-input 的键盘搜索键） */
  onSubmit: () => void
  onClear: () => void
  onCancel: () => void
}

/**
 * 搜索层头排（对应原型 `.sc-top` / `.sc-box` / `.sc-cancel`，index.html L363-L370 /
 * styles.css L778-790，parts/search/sc-top.{html,css}，U62）：放大镜 + 输入框（有字才现身
 * 18px 清除圆点）+「取消」；聚焦时 .sc-box 换 fill3 底 + 1.5px 半透明主色亮环
 *（.sc-box:focus-within）。固定文案「搜歌名、歌手、歌单」「取消」在件内，RN 侧由容器从
 * const/search.ts 传入。
 * 结构自 screens/Search/SearchScreen 内联抽出（2026-10-15 拆件转正轮）：样式逐值照搬原内联
 * 定义，层级与间距归属不变，渲染零变化；无障碍标签与占位同句（原实现即同一常量两用）。
 * 纯展示组件：文本 / 聚焦态与全部回调由容器传入；ref 转发到 TextInput（容器清空后要回焦，
 * 与 OpInputRow 同款做法）。
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
  // 本排的上内衬按档走：原型 `.wide .sc-top{padding-top:36px}`（styles.css:1342）= 状态栏 32 + 4，
  // RN 用实测状态栏 + wide.statusReserve（4）；compact 回 SEARCH.statusBarReserve 的 2（原型 54 = 52 + 2）。
  // 其余三位（左右 14 / 底 12）原型这一档没写覆盖，两档同值。
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
        {/* .sc-x：有输入才出现的清除圆点 */}
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
  /** .sc-top padding:54(状态栏)+14/12 gap:10（顶部内距由实测状态栏接管） */
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SEARCH.gap,
    paddingHorizontal: SEARCH.paddingX,
    paddingBottom: SEARCH.paddingBottom,
  },
  /** .sc-box 40 高 / 13 圆角 / 内距 11 / gap 9 / 1px line 描边 */
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
  /** .sc-input：14.5 / text（字号令牌 FONT_SIZE.title） */
  input: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    fontSize: FONT_SIZE.title,
    fontWeight: FONT_WEIGHT.medium,
  },
  /** .sc-x 18×18 全圆 / 图标 10 */
  clear: {
    width: SEARCH.clearSize,
    height: SEARCH.clearSize,
    borderRadius: SEARCH.clearSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  /** .sc-cancel 13.5 / padding:6px 2px */
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
