import { memo } from 'react'
import { Animated, Pressable, StyleSheet, Text } from 'react-native'

import { usePressFx } from '@/newui/hooks/usePressFx'
import { FONT_SIZE, FONT_WEIGHT, MY_PL, useTheme } from '@/newui/theme'

import { Art } from '../Art'

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface MyPlCardProps {
  /** 歌单名（.mp-n 单行省略） */
  name: string
  /** 副行文案（.mp-s，如「32 首 · 早上七点的地铁」） */
  sub?: string
  /** 封面种子（无图时决定渐变与纹理） */
  artSeed: string
  /** 封面图地址（从平台导入的歌单带图） */
  artUri?: string
  onPress?: () => void
}

/**
 * 我的歌单卡（对应原型 .my-pl，styles.css L334-338）：120 方封面 + 名字 + 副行，摆进 HScroll。
 * 纯展示组件；「打开这份歌单 / 去管理」的副作用由容器接线。
 * 与 RecentCard 的差异：无播放角标、封面圆角 16、宽 120 —— 原型两套规格不合并。
 */
export const MyPlCard = memo(({ name, sub, artSeed, artUri, onPress }: MyPlCardProps) => {
  const theme = useTheme()
  // `.my-pl:active{transform:scale(.95)}`（styles.css L494），过渡 `.2s` 即 MOTION.fast
  const pressFx = usePressFx({ scale: MY_PL.pressScale })
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressFx.onPressIn}
      onPressOut={pressFx.onPressOut}
      style={[styles.root, pressFx.animatedStyle]}
    >
      <Art
        width={MY_PL.artSize}
        height={MY_PL.artSize}
        radius={MY_PL.artRadius}
        seed={artSeed}
        imageUri={artUri}
        scrim
      />
      <Text numberOfLines={1} style={[styles.name, { color: theme.colors.text }]}>
        {name}
      </Text>
      {sub ? (
        <Text numberOfLines={1} style={[styles.sub, { color: theme.colors.text3 }]}>
          {sub}
        </Text>
      ) : null}
    </AnimatedPressable>
  )
})

MyPlCard.displayName = 'NewUIMyPlCard'

const styles = StyleSheet.create({
  /** .my-pl flex:none / width:120px */
  root: {
    width: MY_PL.width,
    flexShrink: 0,
  },
  /** .mp-n 12.5px / 700 / margin-top 8 */
  name: {
    marginTop: MY_PL.nameMarginTop,
    fontSize: FONT_SIZE.smallLg,
    fontWeight: FONT_WEIGHT.bold,
  },
  /** .mp-s 11px / text-3 / margin-top 2 */
  sub: {
    marginTop: MY_PL.subMarginTop,
    fontSize: FONT_SIZE.caption,
  },
})
