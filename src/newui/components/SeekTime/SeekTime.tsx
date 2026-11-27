import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { FONT_SIZE, useTheme } from '@/newui/theme'

export interface SeekTimeProps {
  /** 当前位置（m:ss） */
  currentText: string
  /** 总时长（m:ss） */
  durationText: string
}

/**
 * 播放页起止时间行：两端对齐的「当前位置 / 总时长」，11px text-3、等宽数字。
 * 纯展示组件：两个时间文本由容器传入。
 */
export const SeekTime = memo(({ currentText, durationText }: SeekTimeProps) => {
  const theme = useTheme()
  return (
    <View style={styles.row}>
      <Text style={[styles.text, { color: theme.colors.text3 }]}>{currentText}</Text>
      <Text style={[styles.text, { color: theme.colors.text3 }]}>{durationText}</Text>
    </View>
  )
})

SeekTime.displayName = 'NewUISeekTime'

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: {
    fontSize: FONT_SIZE.caption,
    fontVariant: ['tabular-nums'],
  },
})
