import { memo, type ReactNode } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import type { TabDefinition } from '@/newui/const'
import { usePressFx } from '@/newui/hooks/usePressFx'
// 直连具体 hook（不走 @/newui/hooks 桶口）
import { useWideLayout } from '@/newui/hooks/useWideLayout'
import {
  FONT_SIZE,
  FONT_WEIGHT,
  GLASS,
  GRADIENTS,
  LETTER_SPACING,
  RADIUS,
  SHADOW,
  TAB_BAR,
  useTheme,
} from '@/newui/theme'

import { Icon } from '../Icon'
import { BlurredContainer } from '../Glass'

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface TabBarProps {
  /** Tab 定义（key / 文案 / 图标） */
  items: readonly TabDefinition[]
  /** 当前选中的 key */
  activeKey: string
  onSelect: (key: string) => void
  /** 底部安全区高度 */
  bottomInset?: number
  /** 中央插槽（常驻播放圆圈）：插在 items 中点之后，不占 tab key */
  centerSlot?: ReactNode
}

interface TabProps {
  item: TabDefinition
  active: boolean
  /** 图标直径：竖屏基线 / 宽屏档覆盖 */
  iconSize: number
  onSelect: (key: string) => void
}

/** 单个 Tab：图标 + 文案 + 选中态顶部渐变指示条 */
const Tab = memo(({ item, active, iconSize, onSelect }: TabProps) => {
  const theme = useTheme()
  // 按压缩放（时长见 TAB_BAR.pressScale）
  const pressFx = usePressFx({ scale: TAB_BAR.pressScale })
  const color = active ? theme.colors.text : theme.colors.text3
  return (
    <AnimatedPressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={() => onSelect(item.key)}
      onPressIn={pressFx.onPressIn}
      onPressOut={pressFx.onPressOut}
      style={[styles.tab, pressFx.animatedStyle]}
    >
      {active && (
        <LinearGradient
          colors={[...GRADIENTS.brand.colors]}
          start={GRADIENTS.brand.start}
          end={GRADIENTS.brand.end}
          style={styles.indicator}
        />
      )}
      <Icon name={item.icon} size={iconSize} color={color} />
      <Text style={[styles.label, { color }]}>{item.label}</Text>
    </AnimatedPressable>
  )
})

Tab.displayName = 'NewUITabBarItem'

/**
 * 底部导航栏：手机竖屏 + 手机横过来（.wide）两档，只按档换三条度量（高 / padding-top / 图标），
 * 不随窗口宽度换结构。判据与取值走 useWideLayout，竖屏一律回 TAB_BAR 基线。
 *
 * 底铺走 BlurredContainer，当前关闭真模糊，只留实色 + 同档染色渐变：
 * 1. 玻璃层永远 pointerEvents="none"，只有 Tab 本体吃点击；
 * 2. 原生模块缺失 / 位点禁用时玻璃层自动退回不透明 bg 铺底；
 * 3. 顶部 1px 高光随主题反相；盒外不铺任何收边带。
 */
export const TabBar = memo(({ items, activeKey, onSelect, bottomInset = 0, centerSlot }: TabBarProps) => {
  const theme = useTheme()
  // 宽屏档三条覆盖；compact 全 undefined → 逐值回竖屏基线
  const { wide } = useWideLayout()
  const height = (wide?.tabBarHeight ?? TAB_BAR.height) + bottomInset
  const iconSize = wide?.tabIconSize ?? TAB_BAR.iconSize
  return (
    <View
      style={[
        styles.root,
        {
          height,
          paddingBottom: bottomInset,
          paddingTop: wide?.tabBarPaddingTop ?? TAB_BAR.paddingTop,
        },
      ]}
    >
      {/* 玻璃底：真模糊 + 染色渐变；不可用时退回不透明 bg 铺底；盒外无收边带 */}
      {/* 当前关闭真模糊：只留不透明底色 + 同档染色渐变 */}
      <BlurredContainer spec={GLASS.tabBar} enabled={false} />
      {/* 顶部 1px 高光 */}
      <View pointerEvents="none" style={[styles.hairline, { backgroundColor: theme.colors.hairline }]} />
      {items.slice(0, Math.floor(items.length / 2)).map(item => (
        <Tab key={item.key} item={item} active={item.key === activeKey} iconSize={iconSize} onSelect={onSelect} />
      ))}
      {centerSlot != null ? <View style={styles.centerWrap}>{centerSlot}</View> : null}
      {items.slice(Math.floor(items.length / 2)).map(item => (
        <Tab key={item.key} item={item} active={item.key === activeKey} iconSize={iconSize} onSelect={onSelect} />
      ))}
    </View>
  )
})

TabBar.displayName = 'NewUITabBar'

const styles = StyleSheet.create({
  /** padding-top 按档在渲染期给 */
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  /** 顶部 1px 高光，浅色自动反相 */
  hairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: TAB_BAR.gap,
  },
  /** 中央圆圈：固定宽让左右两半等分，向上抬起压进内容（栏盒不裁切） */
  centerWrap: {
    width: 64,
    alignItems: 'center',
    marginTop: -14,
  },
  /** 选中态 22×3 渐变条，落在 padding-top 区内 */
  indicator: {
    position: 'absolute',
    top: TAB_BAR.indicatorTop,
    width: TAB_BAR.indicatorWidth,
    height: TAB_BAR.indicatorHeight,
    borderRadius: RADIUS.dot,
    ...SHADOW.glow,
  },
  label: {
    fontSize: FONT_SIZE.tiny,
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: LETTER_SPACING.wide,
  },
})
