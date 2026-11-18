import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { FONT_SIZE, useTheme } from '@/newui/theme'

export interface SeekTimeProps {
  /** 当前位置（容器传 store 的 nowPlayTimeStr，m:ss） */
  currentText: string
  /** 总时长（容器传 maxPlayTimeStr，m:ss） */
  durationText: string
}

/**
 * 播放页起止时间行（对应原型 `.seek-time`，index.html L337 / styles.css L640，
 * parts/player/seek-time.{html,css}，U58）：两端对齐的「当前位置 / 总时长」，
 * 11px text-3、tabular-nums 定宽数字（原型 font-variant-numeric 的等价）。
 * 纯展示组件：两个时间文本由容器传入（格式化口径不变，仍在 container 侧）。
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
  /** .seek-time：两端对齐 / 11px tabular */
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: {
    fontSize: FONT_SIZE.caption,
    fontVariant: ['tabular-nums'],
  },
})
