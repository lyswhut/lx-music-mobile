import { memo, type ReactNode } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { FONT_WEIGHT, OPTION_ROW, useTheme } from '@/newui/theme'

export interface GroupLabelProps {
  /** 标签文字（原型「已安装音源」「音乐平台」「音质」） */
  label: string
  /**
   * `.group-label.fold` 右槽（styles.css L776，件 parts/common-control/group-label.css L13）：
   * 传入即把这一行变成 space-between（音源浮层「已安装音源」那行的折叠开关 FoldToggle 走这里）。
   * 不传保持原样 —— 只有一个子节点时 space-between 与原来的整行文字视觉等价，故对既有调用方零影响。
   */
  trailing?: ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * 浮层分组小标（对应原型 .group-label，styles.css L750）：
 * 10.5 / 800 / 字距 1.3 / text-3，上 20 下 9。
 * sheet 内分组标题 ≥2 处出现（音源浮层三组 + 后续任何单选浮层），抽为共通组件。
 * 根节点是 View 而非 Text：`.group-label` 本体只有一条排版规则，`.fold` 变体才是 flex 行
 * （件 L10 / L13），文字下到一个 Text 里承载排版，右槽由 trailing 承载。
 */
export const GroupLabel = memo(({ label, trailing, style }: GroupLabelProps) => {
  const theme = useTheme()
  return (
    <View style={[styles.root, style]}>
      <Text style={[styles.text, { color: theme.colors.text3 }]}>
        {label}
      </Text>
      {trailing}
    </View>
  )
})

GroupLabel.displayName = 'NewUIGroupLabel'

const styles = StyleSheet.create({
  /** .group-label 的外距 + .group-label.fold 的行姿态（gap 10 / space-between / 垂直居中） */
  root: {
    marginTop: OPTION_ROW.labelMarginTop,
    marginBottom: OPTION_ROW.labelMarginBottom,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: OPTION_ROW.labelFoldGap,
  },
  /** .group-label 的排版（10.5 / 800 / 字距 1.3） */
  text: {
    flexShrink: 1,
    fontSize: OPTION_ROW.labelSize,
    fontWeight: FONT_WEIGHT.extraBold,
    letterSpacing: OPTION_ROW.labelLetterSpacing,
  },
})
