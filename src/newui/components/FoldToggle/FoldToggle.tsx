import { memo } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'

import { FOLD_TOGGLE, FONT_WEIGHT, useTheme } from '@/newui/theme'

import { Icon } from '../Icon'

export interface FoldToggleProps {
  /** 开关文字（原型 #scriptFoldLabel：折着时「展开全部 N 个」，摊开时「收起列表」） */
  label: string
  /** 列表当前是否摊开（原型 `.fold-toggle.open`，只决定箭头朝向） */
  expanded: boolean
  onPress: () => void
  /**
   * `.fold-toggle[hidden]{display:none}`（件 parts/common-control/group-label.css L18）的等价物：
   * 原型那枚开关默认就是 `hidden`，条件不满足时压根不露面 —— 这里给 true 直接不渲染，
   * 免得屏上挂一颗「点了没反应的钮」（原型 renderSheet L2274 同口径）。
   */
  hidden?: boolean
}

/**
 * 折叠开关（对应原型 .fold-toggle，styles.css L777-782，件 parts/common-control/group-label.css）：
 * 组标题右槽那一枚「文字 + 一颗 chevron」。箭头两态按件里的角度直译 ——
 * rotate(90deg) = 合（朝下，意思是「展开」）/ rotate(270deg) = 开（朝上，意思是「收起」）；
 * RN 的 transform rotate 同为顺时针，故两个角度照搬，不用换算。
 * 纯展示件：条数够不够折、默认折不折都由容器判定（SourceSheet）。
 */
export const FoldToggle = memo(({ label, expanded, onPress, hidden = false }: FoldToggleProps) => {
  const theme = useTheme()
  if (hidden) return null
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      // 件里靠 padding:2px 0 + margin:-2px -2px 扩热区而不改布局；RN 不认负 margin，
      // 竖向 padding 照搬（与件同高），横向那点外扩交给 hitSlop
      hitSlop={FOLD_TOGGLE.hitPadding}
      style={styles.root}
    >
      {({ pressed }) => (
        <>
          {/* .fold-toggle:active{color:var(--text-2)}（件 L24）：文字与箭头一起抬一档 */}
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
  /** .fold-toggle：row / 垂直居中 / gap 2 */
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FOLD_TOGGLE.gap,
    paddingVertical: FOLD_TOGGLE.hitPadding,
  },
  /** 11 / 700（件 L15；:active 的 text-2 在渲染期换色） */
  text: {
    fontSize: FOLD_TOGGLE.fontSize,
    fontWeight: FONT_WEIGHT.bold,
  },
  icon: {
    flexShrink: 0,
  },
})
