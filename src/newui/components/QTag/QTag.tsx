import { memo } from 'react'
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'

import { CONTROL, FONT_SIZE, FONT_WEIGHT, LETTER_SPACING, RADIUS, useTheme } from '@/newui/theme'

export interface QTagProps {
  /** 标签文字（SQ / 无损 / 热度排序 / 暂不能播 …） */
  label: string
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

/**
 * 迷你标签（对应原型 .q-tag）：音质 / 状态 / 排序等处的 10.5px 小胶囊。
 * 灰底灰字的信息补充件，不用于强调；宽度随内容，不参与拉伸。
 * 原型 token 口径（styles.css L190-194）：底 var(--fill-2) + 描边 inset 1px var(--hairline)，
 * 字色 var(--text-2)——是控件叠色件，不是压在图上的玻璃贴片（那是 .wip-tag），随主题反相。
 */
export const QTag = memo(({ label, style, textStyle }: QTagProps) => {
  const theme = useTheme()
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.colors.fill2, borderColor: theme.colors.hairline },
        style,
      ]}
    >
      <Text numberOfLines={1} style={[styles.text, { color: theme.colors.text2 }, textStyle]}>
        {label}
      </Text>
    </View>
  )
})

QTag.displayName = 'NewUIQTag'

const styles = StyleSheet.create({
  root: {
    alignSelf: 'flex-start',
    flexShrink: 0,
    paddingHorizontal: CONTROL.tagPaddingX,
    paddingVertical: CONTROL.tagPaddingY,
    borderRadius: RADIUS.tagSm,
    borderWidth: 1,
  },
  text: {
    fontSize: FONT_SIZE.tiny,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: LETTER_SPACING.wide,
  },
})
