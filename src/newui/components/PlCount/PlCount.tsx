import { memo } from 'react'
import { StyleSheet, Text } from 'react-native'

import { FONT_SIZE, useTheme } from '@/newui/theme'

export interface PlCountProps {
  /** 计数文案（如「已列出 N / M 个」），由容器拼好 */
  text: string
}

/**
 * 歌单池计数行：推荐池标题右侧的「已列出 N / M 个」灰字。纯展示，文案由容器传入。
 */
export const PlCount = memo(({ text }: PlCountProps) => {
  const theme = useTheme()
  return <Text style={[styles.root, { color: theme.colors.text3 }]}>{text}</Text>
})

PlCount.displayName = 'NewUIPlCount'

const styles = StyleSheet.create({
  root: {
    fontSize: FONT_SIZE.caption,
  },
})
