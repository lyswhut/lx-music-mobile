import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { SETTINGS, useTheme } from '@/newui/theme'

export interface SetHeroProps {
  /** 说明文案（容器传 NEW_UI_SETTING_LABELS.heroSub） */
  text: string
}

/**
 * 设定页说明头（对应原型 `.set-hero` / `.sh-sub`，index.html L263-L265 / styles.css L485-486，
 * parts/setting/set-hero.{html,css}，U48；app.js renderSettings L1359）：
 * 一句「只作用于这台设备」的口径说明。
 * 原型 margin:8px 2px 2px 写在 .set-hero 上、字号与行高在 .sh-sub 上，故 margin 归本件根 View。
 * 结构自 screens/Main/pages/SettingPage 内联抽出（2026-10-15 拆件转正轮）：样式引用逐字照搬
 * 原内联定义（SETTINGS 令牌），渲染零变化。纯展示组件：文案由容器传入，不读任何状态。
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
  /** .set-hero：margin:8px 2px 2px */
  hero: {
    marginTop: SETTINGS.heroMarginTop,
    marginHorizontal: SETTINGS.heroMarginX,
    marginBottom: SETTINGS.heroMarginBottom,
  },
  /** .set-hero .sh-sub：12px / line-height 1.65（≈20） */
  sub: {
    fontSize: SETTINGS.heroSubSize,
    lineHeight: SETTINGS.heroSubLineHeight,
  },
})
