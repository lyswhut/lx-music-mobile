import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import {
  FOOT_NOTE,
  FONT_SIZE,
  GRADIENTS,
  RADIUS,
  useTheme,
} from '@/newui/theme'

export interface FootNoteProps {
  /** 页尾说明文案（原型每个 Tab 页底部那句「曲库内容来自各平台…」） */
  text: string
}

/**
 * 页尾说明（对应原型 .foot-note / .foot-mark）：
 * 渐变小圆点 + 一句话，居中收尾，五个 Tab 页与歌单详情共用。
 */
export const FootNote = memo(({ text }: FootNoteProps) => {
  const theme = useTheme()
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...GRADIENTS.brand.colors]}
        start={GRADIENTS.brand.start}
        end={GRADIENTS.brand.end}
        style={styles.mark}
      />
      <Text style={[styles.text, { color: theme.colors.text3 }]}>{text}</Text>
    </View>
  )
})

FootNote.displayName = 'NewUIFootNote'

const styles = StyleSheet.create({
  /** .foot-note：居中、gap 8、margin-top 32 */
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: FOOT_NOTE.gap,
    marginTop: FOOT_NOTE.marginTop,
  },
  /** .foot-mark：14px 全圆渐变，opacity .6 */
  mark: {
    width: FOOT_NOTE.markSize,
    height: FOOT_NOTE.markSize,
    flexShrink: 0,
    borderRadius: RADIUS.full,
    opacity: FOOT_NOTE.markOpacity,
  },
  /** 11px / text-3，长文案居中换行 */
  text: {
    flexShrink: 1,
    fontSize: FONT_SIZE.caption,
    textAlign: 'center',
  },
})
