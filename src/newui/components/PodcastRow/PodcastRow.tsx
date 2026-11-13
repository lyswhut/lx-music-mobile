import { memo, useId } from 'react'
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg'

import { usePressFx } from '@/newui/hooks/usePressFx'
import {
  FONT_WEIGHT,
  GRADIENTS,
  POD,
  useTheme,
} from '@/newui/theme'

import { Art } from '../Art'
import { Icon } from '../Icon'
import { QTag } from '../QTag'

/** `.pod-rank.top` 渐变字停点，与 --grad 一致（0 / 48% / 100%，_base.css :root L36） */
const RANK_STOP_OFFSETS = [0, 0.48, 1] as const
/** 只有前 3 名上渐变（原型 podRow L1900：`rank <= 3 ? ' top' : ''`） */
const TOP_RANK_MAX = 3
/** 渐变 SVG 文本的画布高（贴合名次槽字号的一行） */
const RANK_SVG_HEIGHT = 18
/** `.pod-rank` 的斜体数字用等宽族（与 SongRow .rank 同一平台近似） */
const RANK_FONT = Platform.select({ ios: 'Menlo', default: 'monospace' })

/**
 * 名次槽（原型 `.pod-rank`：宽 22 居中 / 14 / 900 / 斜体 / text-3，前 3 名转渐变字）。
 * CSS 的 `background-clip:text` 在 RN 无对应，沿用 SongRow 里同一判例：SVG 渐变文本近似。
 */
const RankNumber = memo(({ rank }: { rank: number }) => {
  const theme = useTheme()
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  if (rank > TOP_RANK_MAX) {
    return (
      <Text numberOfLines={1} style={[styles.rank, { color: theme.colors.text3 }]}>
        {rank}
      </Text>
    )
  }
  const gradientId = `podRankGrad${uid}`
  return (
    <Svg width={POD.rankWidth} height={RANK_SVG_HEIGHT}>
      <Defs>
        <SvgLinearGradient
          id={gradientId}
          x1={GRADIENTS.brand.start.x}
          y1={GRADIENTS.brand.start.y}
          x2={GRADIENTS.brand.end.x}
          y2={GRADIENTS.brand.end.y}
        >
          {GRADIENTS.brand.colors.map((color, index) => (
            <Stop key={color} offset={RANK_STOP_OFFSETS[index]} stopColor={color} />
          ))}
        </SvgLinearGradient>
      </Defs>
      <SvgText
        x={POD.rankWidth / 2}
        y={14}
        textAnchor="middle"
        fontSize={POD.rankFontSize}
        fontWeight={FONT_WEIGHT.black}
        fontStyle="italic"
        fontFamily={RANK_FONT}
        fill={`url(#${gradientId})`}
      >
        {String(rank)}
      </SvgText>
    </Svg>
  )
})
RankNumber.displayName = 'NewUIPodcastRowRank'

export interface PodcastRowProps {
  /** 节目名（`.pod-name`，14.5 / 700，单行截断） */
  name: string
  /** 作者（`.pod-by` 左半，← `artistName`） */
  by: string
  /**
   * 分类词（← `tags`）：**行尾只挂第一枚**（原型 podRow L1905-1912 取 `s.tags[0]`）。
   * 不传 / 空数组 = 副行只剩作者，前置竖线 `.sep` 一并省略（与原型 `if (s.tags && s.tags.length)` 同口径）。
   */
  tags?: readonly string[]
  /** 封面种子（`NEW_UI_POD_ART_SEED_PREFIX + id`）：无图 / 图挂了的程序化底 */
  artSeed: string
  /** 封面 URI（榜行是 `artworkUrl100` 那一档，不许承诺 600）；不传即只走种子底 */
  artUri?: string
  /**
   * 名次（1 起）。**可选**：榜行传 `index + 1`（数组序，不是接口字段），
   * 搜节目命中行不传（原型 `podRow(s, 0)`，app.js L2132）——不传时整槽不出现，不占空位。
   */
  rank?: number
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * 节目行（原型 `.pod-row`，`parts/radio/home.css` L54-L79 / app.js `podRow` L1896）：
 * 名次槽 + 56 封面（圆角 13）+ 节目名 + 副行（作者 · 竖线 · 一枚分类词）+ 行尾 chevron。
 * 整行是一个 Pressable（原型 `div[role=button]`，行内没有第二颗按钮），按下时底走 `fill1`
 * （`.pod-row:active{background:var(--fill-1)}`，200ms 缓动，见 `usePressFx`）。
 *
 * **为什么不复用 `SongRow`**（契约 7.1 U81 那行）：
 * 1. 封面档位不同——`SONG_ROW.artSize = 46`，榜行是 56（home.css L403），圆角也不同（13 vs 12）；
 * 2. `SongRowProps.sourceLabel` 是必传的平台角标（歌曲有五平台，节目没有平台概念，行尾那颗是 chevron）；
 * 3. 副行结构不同——`.sr-sub` 是「平台 → 音质 → 歌手 → 专辑」四段带收缩优先级，
 *    `.pod-by` 只有「作者 + 一枚 `.q-tag`」，且带 1×9 竖线；
 * 4. 行高与量测口径不同（74 vs 歌曲行），合并只会让两边都长出 `if` 分支。
 *
 * 跨屏共通：U81 榜列（有名次）与 U83 搜节目命中行（无名次）同一件（app.js L2132）。
 * 纯展示组件：数据由容器传入，不取数、不导航。
 */
export const PodcastRow = memo(
  ({ name, by, tags, artSeed, artUri, rank, onPress, style }: PodcastRowProps) => {
    const theme = useTheme()
    // `.pod-row{transition:.2s var(--ease)}`：行类按原型只变底色、不缩放，这里把底色淡入交给蒙层 opacity
    const pressFx = usePressFx()
    const tag = tags != null && tags.length > 0 ? tags[0] : undefined
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={pressFx.onPressIn}
        onPressOut={pressFx.onPressOut}
        style={[styles.root, style]}
      >
        {/* .pod-row:active{background:var(--fill-1)}：一个不动的底色层淡入，行内元素一概不受影响 */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pressBg,
            { backgroundColor: theme.colors.fill1, opacity: pressFx.progress },
          ]}
        />
        {rank != null && <RankNumber rank={rank} />}
        <Art
          width={POD.rowArtSize}
          height={POD.rowArtSize}
          radius={POD.rowArtRadius}
          seed={artSeed}
          imageUri={artUri}
        />
        <View style={styles.body}>
          <Text numberOfLines={1} style={[styles.name, { color: theme.colors.text }]}>
            {name}
          </Text>
          <View style={styles.by}>
            <Text
              numberOfLines={1}
              style={[styles.byText, { color: theme.colors.text3 }]}
            >
              {by}
            </Text>
            {tag != null && tag.length > 0 && (
              <>
                <View style={[styles.sep, { backgroundColor: theme.colors.lineStrong }]} />
                <QTag label={tag} />
              </>
            )}
          </View>
        </View>
        {/* .pod-open：行尾那颗 chevron 是「进去看」的指向，不是控件（24 槽 / 图标 14，text-3） */}
        <View style={styles.open}>
          <Icon name="chevron" size={POD.openIconSize} color={theme.colors.text3} />
        </View>
      </Pressable>
    )
  },
)

PodcastRow.displayName = 'NewUIPodcastRow'

const styles = StyleSheet.create({
  /** .pod-row：flex row / align center / gap 11 / padding 9×8 / radius 14 */
  root: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: POD.rowGap,
    paddingVertical: POD.rowPaddingY,
    paddingHorizontal: POD.rowPaddingX,
    borderRadius: POD.rowRadius,
  },
  /** 按下底色层：铺满整行、跟行同圆角（行根没有 overflow:hidden，圆角得自己带） */
  pressBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: POD.rowRadius,
  },
  /** .pod-rank：宽 22、flex none、居中、14/900 斜体（渐变档在 RankNumber 内；件里没有字距规则） */
  rank: {
    width: POD.rankWidth,
    flexShrink: 0,
    textAlign: 'center',
    fontSize: POD.rankFontSize,
    fontWeight: FONT_WEIGHT.black,
    fontStyle: 'italic',
    fontFamily: RANK_FONT,
  },
  /** .pod-body：flex 1 / min-width 0 */
  body: {
    flex: 1,
    minWidth: 0,
  },
  /** .pod-name：14.5 / 700 / 单行省略 */
  name: {
    flexShrink: 1,
    fontSize: POD.nameFontSize,
    fontWeight: FONT_WEIGHT.bold,
  },
  /** .pod-by：11.5 / text-3 / margin-top 3 / gap 6 / 不换行不溢出 */
  by: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: POD.byGap,
    marginTop: POD.byMarginTop,
    overflow: 'hidden',
  },
  /** .pod-by>span：min-width 0 + 省略号（作者吸收全部挤压，角标不缩） */
  byText: {
    flexShrink: 1,
    fontSize: POD.byFontSize,
  },
  /** .pod-by .sep：1×9 竖线，flex none */
  sep: {
    width: POD.bySepWidth,
    height: POD.bySepHeight,
    flexShrink: 0,
  },
  /** .pod-open：24×24 居中槽 */
  open: {
    width: POD.openSize,
    height: POD.openSize,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
