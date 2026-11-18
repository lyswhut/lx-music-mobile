import { memo } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { RANK_COVER_DEFAULT, rankCoverKey } from '@/newui/const'
import { ART_INK, CHART_ART, FONT_SIZE, FONT_WEIGHT, LETTER_SPACING, RADIUS } from '@/newui/theme'
import { withAlpha } from '@/newui/utils'

import { RankCover } from '../RankCover'

export interface ChartArtProps {
  /** 宽（卡片用法传正方边长） */
  width: number
  /** 高，缺省 = width（正方卡）；轮 8 的详情头图传横长值即可复用 */
  height?: number
  /** 榜名：既拿它查真实封面（rankCoverKey），也做 .rk-name 文字层 */
  name: string
  /**
   * 真实封面 key（new_design/rank-covers/ 的文件名）。
   * 数据层（useRankBoards）已经按榜名算过就传这里；不传（undefined）则在本组件内按 name 现查
   * —— 两个入口共用 const/rank.ts 那同一颗 rankCoverKey，不存在第二套判据。
   * 传 null（或查不中）= 这个榜没有专属封面，铺 RANK_COVER_DEFAULT 那张兜底图。
   */
  coverKey?: string | null
  /** .rk-sub 副行（平台全称等真实字段）；不传则不渲染第二行 */
  sub?: string
  /** 是否渲染图上文字层（默认 true；轮 8 头图若要独立排版可关掉） */
  showText?: boolean
  /** 圆角，默认 --r-m（同 .rk-card） */
  radius?: number
  style?: StyleProp<ViewStyle>
}

/**
 * 榜单封面（原型 app.js 的 chartFace / chartArt，styles.css 的 .rk-card / .art.chart-art / .rk-copy / .rk-name / .rk-sub）：
 * 「该榜」的共用视觉资产，卡片（RankCard）与轮 8 的详情头图都吃它。判据只有一条：
 * 榜名命中 rankCoverKey 那张表 → 铺 new_design/rank-covers/ 里那一整张插画（RankCover，49 张 512×512：48 张判据 + 1 张兜底，
 * 母图是无损 PNG 只留原型那侧，进包的是压出来的 q85 WebP）；命不中 → 铺同包那张 default 兜底图。
 * 两支都是**一张真插画铺满**，卡上那两行白字直接压在图上：两行字钉**左上角**（.rk-copy 一个流内块，
 * 榜名长到两行时平台行跟着下移），可读性只靠各自那圈紧贴字边的小投影兜（`CHART_ART.shadow*`，两行同档）。
 * 2026-10-22 之前这里还有一层 .rk-scrim 压顶遮罩（对出包那 49 张 WebP 逐像素反解、最坏像素过 4.5:1），
 * 用户看后判定「遮罩过了」——插画上半截糊成一块黑，整层撤掉；撤完那档 0 2px 14px 的大模糊投影又摊成
 * 一层灰纱（判成「像垫了块浅灰底板」），于是两行字的投影一起收紧到 0 1px 3px .55。
 * 这里以前还有第二支「通用符号」（按榜名上强调色 + 该榜型一枚单色线条符号）：
 * 2026-10-22 用户交来 default 兜底图后整支退役——自创的无彩底混在一排彩色封面里一眼就掉队。
 * 图上文字锁白（ART_INK），不参与浅/深主题反相——封面恒为深底/实拍图。
 * 纯展示组件：不读 store、不发请求、不接点击（交互由外层 RankCard/容器负责）。
 */
export const ChartArt = memo(
  ({ width, height = width, name, coverKey, sub, showText = true, radius = RADIUS.m, style }: ChartArtProps) => {
    const cover = (coverKey === undefined ? rankCoverKey(name) : coverKey) ?? RANK_COVER_DEFAULT
    return (
      <View
        style={[
          styles.root,
          // .rk-card / .art.chart-art 那层 #0B1220 底：平时被插画整个盖住，只垫图没到位那一瞬
          { backgroundColor: CHART_ART.cardBg, borderRadius: radius, height, width },
          style,
        ]}
      >
        <RankCover coverKey={cover} height={height} width={width} />
        {/* .rk-copy：两行字同一个流内块（左上角），榜名长到两行时平台行跟着往下走，不会叠字 */}
        {showText ? (
          <View style={styles.copy}>
            {/* .rk-name：榜名（平台给的真名），白 900 + 紧贴字边的小投影，最多两行 */}
            <Text numberOfLines={2} style={styles.name}>
              {name}
            </Text>
            {/* .rk-sub：平台全称。卡上只留这两行真数据，「N 首」「每小时更新」原型已撤，不加 */}
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

/** .rk-name / .rk-sub 同一档 text-shadow：0 1px 3px rgba(0,0,0,.55)（两行同值，原型 styles.css） */
const shadow = {
  textShadowColor: withAlpha(ART_INK.veil, CHART_ART.shadowAlpha),
  textShadowOffset: { width: 0, height: CHART_ART.shadowOffsetY },
  textShadowRadius: CHART_ART.shadowRadius,
} as const

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  /** .rk-copy：文字块 absolute 钉左上角（top 12 / left·right 13），两行在里面跟着流走 */
  copy: {
    position: 'absolute',
    top: CHART_ART.copyTop,
    left: CHART_ART.copyInsetX,
    right: CHART_ART.copyInsetX,
  },
  /** .rk-name：17 / 900 / 行高 1.25 / 字距 .3，最多两行（原型 -webkit-line-clamp:2） */
  name: {
    fontSize: CHART_ART.nameSize,
    fontWeight: FONT_WEIGHT.black,
    lineHeight: CHART_ART.nameLineHeight,
    letterSpacing: LETTER_SPACING.normal,
    color: ART_INK.fg,
    ...shadow,
  },
  /** .rk-sub：紧跟榜名 2px / 10.5 / 700 / 字距 .2 / 白 .76，单行省略（原型 nowrap + ellipsis） */
  sub: {
    marginTop: CHART_ART.subMarginTop,
    fontSize: FONT_SIZE.tiny,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: LETTER_SPACING.tight,
    color: withAlpha(ART_INK.fg, CHART_ART.subAlpha),
    // 原型这行原先没有投影，浅色天空上最弱；2026-10-22 与榜名同挂一档
    ...shadow,
  },
})
