import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { SETTINGS, useTheme } from '@/newui/theme'

export interface SetHeroProps {
  /** 说明文案 */
  text: string
}

/**
 * 设定页说明头：一句「只作用于这台设备」的口径说明。纯展示组件。
 */
export const SetHero = memo(({ text }: SetHeroProps) => {
  const theme = useTheme()
  return (
    <View style={styles.hero}>
      <Text style={[styles.sub, { color: theme.colors.text3 }]}>{text}</Text>
    </View>
  )
})

SetHero.displayName = 'NewUISetHero'

const styles = StyleSheet.create({
  hero: {
    marginTop: SETTINGS.heroMarginTop,
    marginHorizontal: SETTINGS.heroMarginX,
    marginBottom: SETTINGS.heroMarginBottom,
  },
  sub: {
    fontSize: SETTINGS.heroSubSize,
    lineHeight: SETTINGS.heroSubLineHeight,
  },
})
