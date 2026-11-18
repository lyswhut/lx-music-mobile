import { Fragment, memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import {
  FONT_SIZE,
  FONT_WEIGHT,
  PL_LAYER,
  RADIUS,
  SHADOW,
  useTheme,
} from '@/newui/theme'

import { Art, ChartArt, QTag } from '@/newui/components'

export interface PlaylistHeroProps {
  /** 封面种子（歌单坐标 source__id，与详情层底纹同源） */
  artSeed: string
  /** 封面图（passProp img 优先，回落平台返回的 info.img） */
  artUri?: string
  name: string
  /** 简介（原型 ph-sub：desc || author，空则不渲染） */
  sub: string
  /** .ph-meta 左胶囊（rank 形态 = 平台名；pl/mine 形态 = 「n/m 首可播」） */
  metaTag: string
  /** 胶囊后的文字段（原型：rank 形态「N 首」、plays「N播放」），以 1×9 竖线分隔 */
  metaParts: string[]
  /**
   * rank 形态专属：true 时头图方块换成 ChartArt（该榜那张真插画，判据命不中铺 default 兜底），
   * 与榜单页 RankCard 共用同一颗 rankCoverKey，点进详情认的还是同一张脸（原型 app.js 的 chartArt(plNow)）。
   * 缺省（false）走 Art 封面。
   */
  isChart?: boolean
}

/**
 * 歌单详情头部（对应原型 .pl-hero，styles.css 的 .pl-hero 一族）：
 * 124 大封面 + 底部对齐的名字 / 简介 / 元信息行。
 * 头图方块两种脸（原型 app.js 的 chartArt(plNow) 分支）：rank 形态 = ChartArt（该榜那张插画，不带文字，
 * 与榜单页卡片同一条查表）；其余形态 = Art（真实封面图优先，无图走种子程序化底）。
 * 纯展示组件：可播统计与文案拼接都由容器算好后传入。
 */
export const PlaylistHero = memo(({ artSeed, artUri, name, sub, metaTag, metaParts, isChart }: PlaylistHeroProps) => {
  const theme = useTheme()
  return (
    <View style={styles.root}>
      {isChart
        // 榜单形态头图 = 该榜的视觉资产（原型 chartArt(plNow)）：
        // 只有插画、不含文字——原型 chartArt() 生成的方块里没有 .rk-name/.rk-sub 两层
        // （那两个是 rankCard() 才加的），榜名文字在正文侧 h3，故 showText=false，避免出现两遍榜名。
        // 尺寸/圆角与原型 .pl-hero .art 对齐：124×124（PL_LAYER.heroArtSize）、radius 20（RADIUS.art）。
        ? (
          <ChartArt
            width={PL_LAYER.heroArtSize}
            height={PL_LAYER.heroArtSize}
            name={name}
            showText={false}
            radius={RADIUS.art}
            style={styles.art}
          />
        )
        : (
          <Art
            width={PL_LAYER.heroArtSize}
            height={PL_LAYER.heroArtSize}
            radius={RADIUS.art}
            seed={artSeed}
            imageUri={artUri}
            style={styles.art}
          />
        )}
      <View style={styles.body}>
        <Text numberOfLines={2} style={[styles.name, { color: theme.colors.text }]}>
          {name}
        </Text>
        {sub.length > 0 && (
          <Text numberOfLines={2} style={[styles.sub, { color: theme.colors.text2 }]}>
            {sub}
          </Text>
        )}
        <View style={styles.meta}>
          <QTag label={metaTag} />
          {metaParts.map(part => (
            <Fragment key={part}>
              <View style={[styles.sep, { backgroundColor: theme.colors.lineStrong }]} />
              <Text style={[styles.metaText, { color: theme.colors.text3 }]}>{part}</Text>
            </Fragment>
          ))}
        </View>
      </View>
    </View>
  )
})

PlaylistHero.displayName = 'NewUIPlaylistHero'

const styles = StyleSheet.create({
  /** .pl-hero display:flex gap:14 margin:22px 0 2px min-height:124 */
  root: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: PL_LAYER.heroGap,
    marginTop: PL_LAYER.heroMarginTop,
    marginBottom: PL_LAYER.heroMarginBottom,
    minHeight: PL_LAYER.heroMinHeight,
  },
  /** .pl-hero .art 外投影（CSS 负 spread 无法表达，取 SHADOW.card 近似） */
  art: {
    ...SHADOW.card,
  },
  /** .ph-body：flex:1 内容底部对齐 gap:6 */
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'flex-end',
    gap: PL_LAYER.heroBodyGap,
  },
  /** h3 18/900 line-height 1.35 */
  name: {
    fontSize: FONT_SIZE.heading,
    fontWeight: FONT_WEIGHT.black,
    lineHeight: Math.round(FONT_SIZE.heading * PL_LAYER.heroTitleLineHeightRatio),
  },
  /** .ph-sub 11.5/1.5 */
  sub: {
    fontSize: FONT_SIZE.captionLg,
    lineHeight: Math.round(FONT_SIZE.captionLg * PL_LAYER.heroSubLineHeightRatio),
  },
  /** .ph-meta flex-wrap gap:6（10.5 号三级字）；与上方文案的节奏由 .ph-body 的 gap:6 承担 */
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: PL_LAYER.metaGap,
  },
  metaText: {
    fontSize: FONT_SIZE.tiny,
  },
  /** .sep 1×9 竖线 */
  sep: {
    width: PL_LAYER.metaSepWidth,
    height: PL_LAYER.metaSepHeight,
  },
})
