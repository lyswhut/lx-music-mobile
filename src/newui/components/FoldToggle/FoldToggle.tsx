import { memo } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'

import { FOLD_TOGGLE, FONT_WEIGHT, useTheme } from '@/newui/theme'

import { Icon } from '../Icon'

export interface FoldToggleProps {
  /** 开关文字（折着「展开全部 N 个」，摊开「收起列表」） */
  label: string
  /** 列表当前是否摊开，只决定箭头朝向 */
  expanded: boolean
  onPress: () => void
  /**
   * true 时直接不渲染（对应原型默认 hidden），
   * 避免屏上挂一颗「点了没反应的钮」。
   */
  hidden?: boolean
}

/**
 * 折叠开关：组标题右槽的「文字 + 一颗 chevron」，箭头角度两态对应合 / 开。
 * 纯展示件：条数够不够折、默认折不折都由容器判定。
 */
export const FoldToggle = memo(({ label, expanded, onPress, hidden = false }: FoldToggleProps) => {
  const theme = useTheme()
  if (hidden) return null
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      // 竖向 padding 照搬，横向热区外扩交给 hitSlop（RN 不认负 margin）
      hitSlop={FOLD_TOGGLE.hitPadding}
      style={styles.root}
    >
      {({ pressed }) => (
        <>
          {/* 按下时文字与箭头一起抬一档 */}
          <Text style={[styles.text, { color: pressed ? theme.colors.text2 : theme.colors.text3 }]}>
            {label}
          </Text>
          <Icon
            name="chevron"
            size={FOLD_TOGGLE.iconSize}
            color={pressed ? theme.colors.text2 : theme.colors.text3}
            style={[
              styles.icon,
              {
                opacity: FOLD_TOGGLE.iconAlpha,
                transform: [{ rotate: expanded ? FOLD_TOGGLE.iconAngleExpanded : FOLD_TOGGLE.iconAngleCollapsed }],
              },
            ]}
          />
        </>
      )}
    </Pressable>
  )
})

FoldToggle.displayName = 'NewUIFoldToggle'

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FOLD_TOGGLE.gap,
    paddingVertical: FOLD_TOGGLE.hitPadding,
  },
  text: {
    fontSize: FOLD_TOGGLE.fontSize,
    fontWeight: FONT_WEIGHT.bold,
  },
  icon: {
    flexShrink: 0,
  },
})
