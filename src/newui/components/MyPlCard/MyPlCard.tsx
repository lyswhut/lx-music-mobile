import { memo } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'

import { FONT_SIZE, FONT_WEIGHT, MY_PL, useTheme } from '@/newui/theme'

import { Art } from '../Art'

export interface MyPlCardProps {
  /** 歌单名（单行省略） */
  name: string
  /** 副行文案（如「32 首 · 早上七点的地铁」） */
  sub?: string
  /** 封面种子（无图时决定渐变与纹理） */
  artSeed: string
  /** 封面图地址（从平台导入的歌单带图） */
  artUri?: string
  onPress?: () => void
}

/**
 * 我的歌单卡：120 方封面 + 名字 + 副行，摆进 HScroll。
 * 无播放角标，封面圆角 16、宽 120。纯展示组件，副作用由容器接线。
 */
export const MyPlCard = memo(({ name, sub, artSeed, artUri, onPress }: MyPlCardProps) => {
  const theme = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={styles.root}
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
    </Pressable>
  )
})

MyPlCard.displayName = 'NewUIMyPlCard'

const styles = StyleSheet.create({
  /** 卡片宽度（横向列表内不收缩） */
  root: {
    width: MY_PL.width,
    flexShrink: 0,
  },
  name: {
    marginTop: MY_PL.nameMarginTop,
    fontSize: FONT_SIZE.smallLg,
    fontWeight: FONT_WEIGHT.bold,
  },
  sub: {
    marginTop: MY_PL.subMarginTop,
    fontSize: FONT_SIZE.caption,
  },
})
