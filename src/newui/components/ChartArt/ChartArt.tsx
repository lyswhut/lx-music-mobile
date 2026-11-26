import { memo } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { RANK_COVER_DEFAULT, rankCoverKey } from '@/newui/const'
import { ART_INK, CHART_ART, FONT_SIZE, FONT_WEIGHT, LETTER_SPACING, RADIUS } from '@/newui/theme'
import { withAlpha } from '@/newui/utils'

import { RankCover } from '../RankCover'

export interface ChartArtProps {
  /** 宽（卡片用法传正方边长） */
  width: number
  /** 高，缺省 = width（正方卡） */
  height?: number
  /** 榜名：用于查真实封面（rankCoverKey）与渲染文字层 */
  name: string
  /**
   * 真实封面 key；undefined 时按 name 现查，null / 查不中则铺 RANK_COVER_DEFAULT 兜底图。
   */
  coverKey?: string | null
  /** 副行（平台全称等真实字段）；不传则不渲染第二行 */
  sub?: string
  /** 是否渲染图上文字层，默认 true */
  showText?: boolean
  /** 圆角，默认 RADIUS.m */
  radius?: number
  style?: StyleProp<ViewStyle>
}

/**
 * 榜单封面：按 rankCoverKey 命中则铺对应插画，查不中铺兜底图；
 * 两行白字压左上角，靠紧贴字边的小投影保证可读。纯展示组件，交互由 RankCard / 容器负责。
 */
export const ChartArt = memo(
  ({ width, height = width, name, coverKey, sub, showText = true, radius = RADIUS.m, style }: ChartArtProps) => {
    const cover = (coverKey === undefined ? rankCoverKey(name) : coverKey) ?? RANK_COVER_DEFAULT
    return (
      <View
        style={[
          styles.root,
          // 卡片底：被插画整个盖住，只垫图没到位那一瞬
          { backgroundColor: CHART_ART.cardBg, borderRadius: radius, height, width },
          style,
        ]}
      >
        <RankCover coverKey={cover} height={height} width={width} />
        {/* 两行字同一流内块（左上角），榜名两行时副行跟着下移 */}
        {showText ? (
          <View style={styles.copy}>
            {/* 榜名：白 900 + 紧贴字边的小投影，最多两行 */}
            <Text numberOfLines={2} style={styles.name}>
              {name}
            </Text>
            {/* 副行：平台全称，单行 */}
            {sub != null && (
              <Text numberOfLines={1} style={styles.sub}>
                {sub}
              </Text>
            )}
          </View>
        ) : null}
      </View>
    )
  },
)

ChartArt.displayName = 'NewUIChartArt'

/** 两行同一档 text-shadow（0 1px 3px） */
const shadow = {
  textShadowColor: withAlpha(ART_INK.veil, CHART_ART.shadowAlpha),
  textShadowOffset: { width: 0, height: CHART_ART.shadowOffsetY },
  textShadowRadius: CHART_ART.shadowRadius,
} as const

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  /** 文字块绝对定位钉左上角，两行在内跟随流走 */
  copy: {
    position: 'absolute',
    top: CHART_ART.copyTop,
    left: CHART_ART.copyInsetX,
    right: CHART_ART.copyInsetX,
  },
  /** 榜名：17 / 900 / 行高 1.25 / 字距 .3，最多两行 */
  name: {
    fontSize: CHART_ART.nameSize,
    fontWeight: FONT_WEIGHT.black,
    lineHeight: CHART_ART.nameLineHeight,
    letterSpacing: LETTER_SPACING.normal,
    color: ART_INK.fg,
    ...shadow,
  },
  /** 副行：10.5 / 700 / 字距 .2 / 白 .76，单行省略 */
  sub: {
    marginTop: CHART_ART.subMarginTop,
    fontSize: FONT_SIZE.tiny,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: LETTER_SPACING.tight,
    color: withAlpha(ART_INK.fg, CHART_ART.subAlpha),
    ...shadow,
  },
})
