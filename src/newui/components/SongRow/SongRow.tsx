import { memo, useEffect, useId, useState } from 'react'
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
import LinearGradient from 'react-native-linear-gradient'
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg'

import { usePressFx } from '@/newui/hooks/usePressFx'
import {
  FONT_SIZE,
  FONT_WEIGHT,
  GRADIENTS,
  RADIUS,
  SONG_ROW,
  SPACING,
  useTheme,
} from '@/newui/theme'
import { getCachedSongPic, resolveSongPic } from '@/newui/utils'
import { Art } from '../Art'
import { Icon } from '../Icon'
import { QTag } from '../QTag'

import { EqBars } from './EqBars'
import { SrcBadge } from './SrcBadge'

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/** .rank.top 渐变字：停点与 --grad 一致（0 / 48% / 100%） */
const RANK_STOP_OFFSETS = [0, 0.48, 1] as const
/** 只有前 3 名用渐变字（对应原型 rank <= 3 且可播） */
const TOP_RANK_MAX = 3
/** SVG 渐变文本的画布高（贴合 rank 槽字号的行高） */
const RANK_SVG_HEIGHT = 18
/** .rank 的等宽字体族（原型 ui-monospace 的平台近似） */
const RANK_FONT = Platform.select({ ios: 'Menlo', default: 'monospace' })
/** 更多按钮的热区补足（视觉 24px → 最小触达尺寸） */
const MORE_HIT_SLOP = 10

interface RankNumberProps {
  rank: number
  /** 前 3 名渐变字；不可播（dimmed）时按原型不上渐变 */
  top: boolean
}

/**
 * 排名数字：普通态为等宽斜体三级字色；
 * 顶 3 名用 SVG 渐变文本近似 CSS 的 background-clip:text 渐变字。
 */
const RankNumber = memo(({ rank, top }: RankNumberProps) => {
  const theme = useTheme()
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  if (!top) {
    // numberOfLines=1：3 位编号完整显示在 28dp 槽内，更多位数只截断、绝不折行
    return (
      <Text numberOfLines={1} style={[styles.rank, { color: theme.colors.text3 }]}>
        {rank}
      </Text>
    )
  }
  const gradientId = `rankGrad${uid}`
  return (
    <Svg width={SONG_ROW.rankWidth} height={RANK_SVG_HEIGHT}>
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
        x={SONG_ROW.rankWidth / 2}
        y={14}
        textAnchor="middle"
        fontSize={FONT_SIZE.rank}
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

RankNumber.displayName = 'NewUIRankNumber'

export interface SongRowProps {
  /** 排名序号（1 起）；不传则不渲染排名槽 */
  rank?: number
  /** 封面种子（如 'album:' + 专辑名），决定渐变与程序化纹理 */
  artSeed: string
  /** 封面图 URI；不传时先尝试 musicInfo 补查，再回落到 seed 程序化封面 */
  artUri?: string
  /**
   * 曲目本体（可选）：artUri 缺失时行内自动向平台补查一次真封面（共通行为，
   * 2026-10-12 走查现象 1——酷我等平台的歌单/榜单明细接口不返回逐曲封面，
   * 补图逻辑收敛在本组件 + utils/songPic，调用方只需把手里的曲目传进来；
   * 查不到如实保持 seed 纹理，不转圈不重试）。
   */
  musicInfo?: LX.Music.MusicInfo | null
  title: string
  /** 来源平台简称（getPlatformMeta(source).short），渲染 tint 角标 */
  sourceLabel: string
  /** 来源平台 tint 色（PLATFORM_TINTS）；缺省时用三级文字色 */
  sourceTint?: string
  /** 副行第三段：歌手（.sr-artist） */
  artist: string
  /** 副行第四段：专辑（.sr-album）；空 / 缺省时整段（含其前置分隔条）不渲染 */
  album?: string
  /** 音质标签文案（如 '标准' / '暂不能播'）；空串则不渲染角标 */
  qualityLabel?: string
  /** 时长文本（项目里已格式化好的 interval，例：03:55）；不传则不显示 */
  durationText?: string
  /** 当前曲目：显示 .playing 渐变底 + 1px 内描边 */
  active?: boolean
  /** 正在播放：标题前显示 .eq 均衡条（一般传 active && 播放器未暂停） */
  playing?: boolean
  /** 音源不支持：整行 .off 降透明度、排名不上渐变 */
  dimmed?: boolean
  /** 紧凑规格（.song-list.compact，用于「最近播放」列表） */
  compact?: boolean
  onPress?: () => void
  /** 更多按钮回调；不传则不渲染（对应原型 noMenu） */
  onMore?: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * 歌曲行（对应原型 .song-row，styles.css L247-274）：
 * 排名槽 + 封面（Art）+ 标题（含均衡条）/ 副行四段（平台角标 → 音质角标 → 歌手 → 专辑，
 * 段间 1×9 分隔条）+ 右侧时长 / 更多。
 * 收缩优先级对齐 CSS「专辑 flex-shrink:100 / 歌手 1 / 角标 none」：宽度不足时
 * 专辑吸收约 99% 的挤压先整段挤没，被 Yoga 钳到 0 后剩余溢出才轮到歌手截尾省略。
 * 纯展示组件：播放与菜单行为由容器通过 onPress / onMore 接线。
 */
export const SongRow = memo(
  ({
    rank,
    artSeed,
    artUri,
    musicInfo,
    title,
    sourceLabel,
    sourceTint,
    artist,
    album,
    qualityLabel,
    durationText,
    active = false,
    playing = false,
    dimmed = false,
    compact = false,
    onPress,
    onMore,
    style,
  }: SongRowProps) => {
    const theme = useTheme()
    // `.song-row{transition:background .2s var(--ease)}` + `:active{background:var(--fill-1)}`（styles.css L292/L294）：
    // 行类只变底色、不缩放；底色淡入交给一层不动的蒙层 opacity（同 PodcastRow 判例，不做颜色插值）
    const pressFx = usePressFx()
    const artSize = compact ? SONG_ROW.artSizeCompact : SONG_ROW.artSize
    // 共通补图（走查现象 1）：显式 artUri 恒优先；缺失且给了曲目本体时，
    // 向平台补查一次真封面（模块级缓存去重，命中过的行首帧就有图不再闪纹理）
    const [lazyArtUri, setLazyArtUri] = useState<string | undefined>(() =>
      artUri ? undefined : getCachedSongPic(musicInfo) ?? undefined,
    )
    useEffect(() => {
      if (artUri || musicInfo == null || musicInfo.source === 'local') return
      const cached = getCachedSongPic(musicInfo)
      if (cached !== undefined) {
        setLazyArtUri(cached ?? undefined)
        return
      }
      let alive = true
      void resolveSongPic(musicInfo).then(url => {
        if (alive && url != null) setLazyArtUri(url)
      })
      return () => {
        alive = false
      }
    }, [artUri, musicInfo])
    const rowArtUri = artUri ?? lazyArtUri
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={pressFx.onPressIn}
        onPressOut={pressFx.onPressOut}
        style={[
          styles.root,
          compact ? styles.rootCompact : styles.rootRegular,
          active && { borderColor: theme.colors.playingBorder },
          dimmed && styles.dimmed,
          style,
        ]}
      >
        {/* .song-row:active{background:var(--fill-1)}：一层不动的底色蒙层淡入。
            正在播的行（.playing 自带渐变底）不叠这一层，与改造前 `pressed && !active` 同一口径 */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pressBg,
            {
              backgroundColor: theme.colors.fill1,
              opacity: active ? 0 : pressFx.progress,
            },
          ]}
        />
        {active && (
          <LinearGradient
            colors={[...GRADIENTS.brandSoft.colors]}
            start={GRADIENTS.brandSoft.start}
            end={GRADIENTS.brandSoft.end}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
        )}
        {rank != null && <RankNumber rank={rank} top={!dimmed && rank <= TOP_RANK_MAX} />}
        <Art
          width={artSize}
          height={artSize}
          radius={RADIUS.artXs}
          seed={artSeed}
          imageUri={rowArtUri}
          scrim
        />
        <View style={styles.body}>
          <View style={styles.titleRow}>
            {playing && <EqBars />}
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                compact && styles.titleCompact,
                { color: theme.colors.text },
              ]}
            >
              {title}
            </Text>
          </View>
          {/* 副行四段固定顺序（原型 app.js L433-442 / styles.css L292-298）：
              平台角标 → 音质角标 → 歌手 → 专辑；角标不缩，放不下先舍专辑再截歌手 */}
          <View style={styles.subRow}>
            <SrcBadge label={sourceLabel} tint={sourceTint ?? theme.colors.text3} />
            {qualityLabel ? <QTag label={qualityLabel} /> : null}
            {artist.length > 0 && (
              <>
                <View style={[styles.sep, { backgroundColor: theme.colors.lineStrong }]} />
                <Text
                  numberOfLines={1}
                  style={[styles.artist, { color: theme.colors.text3 }]}
                >
                  {artist}
                </Text>
              </>
            )}
            {album != null && album.length > 0 && (
              <>
                <View style={[styles.sep, { backgroundColor: theme.colors.lineStrong }]} />
                <Text
                  numberOfLines={1}
                  style={[styles.album, { color: theme.colors.text3 }]}
                >
                  {album}
                </Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.right}>
          {durationText != null && (
            <Text style={[styles.duration, { color: theme.colors.text3 }]}>{durationText}</Text>
          )}
          {onMore != null && (
            <Pressable onPress={onMore} hitSlop={MORE_HIT_SLOP} style={styles.more}>
              {({ pressed }) => (
                <Icon
                  name="more"
                  size={SONG_ROW.moreIconSize}
                  color={pressed ? theme.colors.text : theme.colors.text3}
                />
              )}
            </Pressable>
          )}
        </View>
      </AnimatedPressable>
    )
  },
)

SongRow.displayName = 'NewUISongRow'

const styles = StyleSheet.create({
  root: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SONG_ROW.gap,
    borderRadius: RADIUS.control,
    // 1px 内描边用透明 border 占位（CSS inset shadow 不占布局），避免 active 切换时跳动
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  rootRegular: {
    paddingTop: SONG_ROW.paddingY,
    paddingRight: SONG_ROW.paddingRight,
    paddingBottom: SONG_ROW.paddingY,
    paddingLeft: SONG_ROW.paddingLeft,
  },
  rootCompact: {
    paddingTop: SONG_ROW.compactPaddingY,
    paddingRight: SONG_ROW.compactPaddingRight,
    paddingBottom: SONG_ROW.compactPaddingY,
    paddingLeft: SONG_ROW.compactPaddingLeft,
  },
  dimmed: {
    opacity: 0.45,
  },
  /** 按下底色蒙层：铺满整行、跟着根节点的 14 圆角与 overflow:hidden 裁切 */
  pressBg: {
    ...StyleSheet.absoluteFillObject,
  },
  rank: {
    // minWidth 而非固定 width：1~3 位（甚至更多）编号一律单行完整显示——
    // 槽按 SONG_ROW.rankWidth 兜底对齐（≤28dp 的所有位数同宽不串列），
    // 超宽时槽就地撑开、绝不折行；配合 Text numberOfLines=1 双保险。
    minWidth: SONG_ROW.rankWidth,
    flexShrink: 0,
    textAlign: 'center',
    fontSize: FONT_SIZE.rank,
    fontWeight: FONT_WEIGHT.black,
    fontStyle: 'italic',
    fontFamily: RANK_FONT,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  title: {
    flexShrink: 1,
    fontSize: FONT_SIZE.title,
    fontWeight: FONT_WEIGHT.bold,
  },
  titleCompact: {
    fontSize: SONG_ROW.titleSizeCompact,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SONG_ROW.subGap,
    marginTop: SONG_ROW.subMarginTop,
    overflow: 'hidden',
  },
  /** .sr-sub .sep：1×9 分隔条，flex:none（不参与收缩） */
  sep: {
    width: SONG_ROW.sepWidth,
    height: SONG_ROW.sepHeight,
    flexShrink: 0,
  },
  /** .sr-artist：flex:0 1 auto，正常截尾 */
  artist: {
    flexShrink: SONG_ROW.artistFlexShrink,
    fontSize: FONT_SIZE.captionLg,
  },
  /** .sr-album：flex:0 100 auto，宽度不足时先被挤没（见组件头注释的 RN 近似说明） */
  album: {
    flexShrink: SONG_ROW.albumFlexShrink,
    fontSize: FONT_SIZE.captionLg,
  },
  right: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  duration: {
    fontSize: FONT_SIZE.captionLg,
    fontVariant: ['tabular-nums'],
  },
  more: {
    padding: SONG_ROW.morePadding,
  },
})
