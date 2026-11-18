import { memo } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'

import { usePressFx } from '@/newui/hooks/usePressFx'
import { FONT_SIZE, FONT_WEIGHT, QUICK_ROW, RADIUS, useTheme } from '@/newui/theme'

import { Art } from '../Art'
import { type IconName } from '../Icon'

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface QuickEntry {
  /** 业务 key，容器据此分派动作（原型 QUICK[].key） */
  key: string
  /** 下方文案（.quick span） */
  label: string
  /** 封面块里的图标 */
  icon: IconName
  /** 封面种子，决定这一格的渐变底 */
  artSeed: string
}

export interface QuickRowProps {
  /** 入口列表（首页四格：每日推荐 / 排行榜 / 电台 / 我喜欢） */
  items: QuickEntry[]
  onPress: (key: string) => void
}

/** 单格（.quick）：hook 不能进 map 回调，故把一格拆成组件——元素树与改造前一模一样 */
const QuickCell = memo(({ item, onPress }: { item: QuickEntry, onPress: (key: string) => void }) => {
  const theme = useTheme()
  // `.quick:active{transform:scale(.92)}`（styles.css L223），过渡 `.2s` 即 MOTION.fast
  const pressFx = usePressFx({ scale: QUICK_ROW.pressScale })
  return (
    <AnimatedPressable
      onPress={() => onPress(item.key)}
      onPressIn={pressFx.onPressIn}
      onPressOut={pressFx.onPressOut}
      style={[styles.cell, pressFx.animatedStyle]}
    >
      <Art
        width={QUICK_ROW.artSize}
        height={QUICK_ROW.artSize}
        radius={RADIUS.art}
        seed={item.artSeed}
        icon={item.icon}
        iconSize={QUICK_ROW.iconSize}
      />
      <Text numberOfLines={1} style={[styles.label, { color: theme.colors.text2 }]}>
        {item.label}
      </Text>
    </AnimatedPressable>
  )
})
QuickCell.displayName = 'NewUIQuickCell'

/**
 * 快捷入口四宫格（对应原型 .quick-row / .quick / .qa，styles.css L193-197）。
 * 纯展示组件：每格做什么（播放 / 切 Tab / 进电台首页）由容器分派。
 */
export const QuickRow = memo(({ items, onPress }: QuickRowProps) => (
  <View style={styles.root}>
    {items.map(item => (
      <QuickCell key={item.key} item={item} onPress={onPress} />
    ))}
  </View>
))

QuickRow.displayName = 'NewUIQuickRow'

const styles = StyleSheet.create({
  /** grid-template-columns:repeat(4,1fr)，gap 8，margin-top 22 */
  root: {
    flexDirection: 'row',
    gap: QUICK_ROW.gap,
    marginTop: QUICK_ROW.marginTop,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: QUICK_ROW.labelGap,
  },
  /** .quick span 11.5px / 600（原型无字距） */
  label: {
    fontSize: FONT_SIZE.captionLg,
    fontWeight: FONT_WEIGHT.semibold,
  },
})
