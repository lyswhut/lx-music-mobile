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
  /** 简介（desc || author，空则不渲染） */
  sub: string
  /** 左胶囊：rank 形态 = 平台名；pl/mine 形态 = 总曲目数 */
  metaTag: string
  /** 胶囊后的文字段（如「N 首」「N 播放」），以竖线分隔 */
  metaParts: string[]
  /**
   * rank 形态：true 时头图换 ChartArt（该榜那张真插画），与榜单页 RankCard 共用 rankCoverKey；
   * 缺省走 Art 封面。
   */
  isChart?: boolean
}

/**
 * 歌单详情头部：124 大封面 + 名字 / 简介顶对齐、平台 / 播放数底对齐。
 * 纯展示组件：可播统计与文案拼接都由容器算好后传入。
 */
export const PlaylistHero = memo(({ artSeed, artUri, name, sub, metaTag, metaParts, isChart }: PlaylistHeroProps) => {
  const theme = useTheme()
  return (
    <View style={styles.root}>
      {isChart
        // 榜单头图 = 该榜插画，不含文字（榜名在正文侧），避免出现两遍榜名；
        // 尺寸 / 圆角与头部封面一致
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
        <View style={styles.head}>
          <Text numberOfLines={2} style={[styles.name, { color: theme.colors.text }]}>
            {name}
          </Text>
          {sub.length > 0 && (
            <Text numberOfLines={2} style={[styles.sub, { color: theme.colors.text2 }]}>
              {sub}
            </Text>
          )}
        </View>
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
  root: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: PL_LAYER.heroGap,
    marginTop: PL_LAYER.heroMarginTop,
    marginBottom: PL_LAYER.heroMarginBottom,
    minHeight: PL_LAYER.heroMinHeight,
  },
  /** 外投影（CSS 负 spread 无法表达，取 SHADOW.card 近似） */
  art: {
    ...SHADOW.card,
  },
  /** 名字 / 简介贴顶，平台 / 热度贴底 */
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    gap: PL_LAYER.heroBodyGap,
  },
  /** 名字与简介之间的紧凑节奏 */
  head: {
    gap: PL_LAYER.heroBodyGap,
  },
  name: {
    fontSize: FONT_SIZE.heading,
    fontWeight: FONT_WEIGHT.black,
    lineHeight: Math.round(FONT_SIZE.heading * PL_LAYER.heroTitleLineHeightRatio),
  },
  sub: {
    fontSize: FONT_SIZE.captionLg,
    lineHeight: Math.round(FONT_SIZE.captionLg * PL_LAYER.heroSubLineHeightRatio),
  },
  /** 平台 / 播放数行，可换行 */
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: PL_LAYER.metaGap,
  },
  metaText: {
    fontSize: FONT_SIZE.tiny,
  },
  /** 竖线分隔符 */
  sep: {
    width: PL_LAYER.metaSepWidth,
    height: PL_LAYER.metaSepHeight,
  },
})
