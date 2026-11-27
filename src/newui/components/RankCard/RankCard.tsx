import { memo } from 'react'
import { Pressable, StyleSheet } from 'react-native'

import { ChartArt } from '../ChartArt'

import { ART_INK, RADIUS, RANK_CARD } from '@/newui/theme'
import { withAlpha } from '@/newui/utils'

export interface RankCardProps {
  /** 单卡边长（容器按当前档列数算出宽度传入） */
  width: number
  /** 榜名（交给 ChartArt 查封面并做文字层） */
  name: string
  /** 副行：平台全称 */
  sub: string
  /** 真实封面 key；不传由 ChartArt 现查 */
  coverKey?: string | null
  onPress?: () => void
}

/**
 * 榜单卡：正方卡 = ChartArt（真插画铺满，命不中铺 default）+ 两行白字压图 + 1px 白色高光内描边。
 * 纯展示组件；「点进去看完整排名」由容器接线。
 */
export const RankCard = memo(({ width, name, sub, coverKey, onPress }: RankCardProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.root,
        {
          width,
          height: width,
          // 外投影带负 spread，RN shadow 表达不了，只用内描边表达层次
          borderColor: withAlpha(ART_INK.fg, RANK_CARD.ringAlpha),
        },
      ]}
    >
      <ChartArt coverKey={coverKey} height={width} name={name} sub={sub} width={width} />
    </Pressable>
  )
})

RankCard.displayName = 'NewUIRankCard'

const styles = StyleSheet.create({
  root: {
    flexShrink: 0,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    overflow: 'hidden',
  },
})
