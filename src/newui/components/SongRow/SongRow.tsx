import { memo, useEffect, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

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

/** 更多按钮的热区补足（视觉 24px → 最小触达尺寸） */
const MORE_HIT_SLOP = 10

export interface SongRowProps {
  /** 封面种子（如 'album:' + 专辑名），决定渐变与程序化纹理 */
  artSeed: string
  /** 封面图 URI；不传时先尝试补查，再回落 seed 程序化封面 */
  artUri?: string
  /**
   * 曲目本体（可选）：artUri 缺失时行内自动向平台补查一次真封面（歌单/榜单明细接口常不返回逐曲封面）；
   * 查不到保持 seed 纹理，不转圈不重试。
   */
  musicInfo?: LX.Music.MusicInfo | null
  title: string
  /** 来源平台简称，渲染 tint 角标 */
  sourceLabel: string
  /** 来源平台 tint 色；缺省用三级文字色 */
  sourceTint?: string
  /** 副行第三段：歌手 */
  artist: string
  /** 副行第四段：专辑；空 / 缺省时整段不渲染 */
  album?: string
  /** 音质标签文案；空串则不渲染角标 */
  qualityLabel?: string
  /** 时长文本（已格式化的 interval，例：03:55）；不传则不显示 */
  durationText?: string
  /** 当前曲目：渐变底 + 1px 内描边 */
  active?: boolean
  /** 正在播放：标题前显示均衡条 */
  playing?: boolean
  /** 音源不支持：整行降透明度 */
  dimmed?: boolean
  /** 紧凑规格，用于「最近播放」列表 */
  compact?: boolean
  onPress?: () => void
  /** 更多按钮回调；不传则不渲染 */
  onMore?: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * 歌曲行：封面 + 标题（含均衡条）/ 副行四段（平台角标 → 音质角标 → 歌手 → 专辑）
 * + 右侧时长 / 更多。
 * 收缩优先级：宽度不足时专辑先整段挤没，被钳到 0 后剩余溢出才轮到歌手截尾。
 * 纯展示组件：播放与菜单行为由容器通过 onPress / onMore 接线。
 */
export const SongRow = memo(
  ({
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
    const artSize = compact ? SONG_ROW.artSizeCompact : SONG_ROW.artSize
    // 补图：显式 artUri 恒优先；缺失且给了曲目本体时向平台补查一次
    //（模块级缓存去重，命中过的行首帧就有图）
    const [lazyArtUri, setLazyArtUri] = useState<string | undefined>(() =>
      artUri ? undefined : getCachedSongPic(musicInfo) ?? undefined,
    )
    useEffect(() => {
      if (artUri != null || musicInfo == null || musicInfo.source === 'local') return
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
      <Pressable
        onPress={onPress}
        style={[
          styles.root,
          compact ? styles.rootCompact : styles.rootRegular,
          active && styles.rootActive,
          active && { borderColor: theme.colors.playingBorder },
          dimmed && styles.dimmed,
          style,
        ]}
      >
        {active && (
          <LinearGradient
            colors={[...GRADIENTS.brandSoft.colors]}
            start={GRADIENTS.brandSoft.start}
            end={GRADIENTS.brandSoft.end}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
        )}
        <Art
          width={artSize}
          height={artSize}
          radius={RADIUS.artXs}
          seed={artSeed}
          imageUri={rowArtUri}
        />
        <View style={[styles.body, styles.rowGap]}>
          <View style={styles.titleRow}>
            {playing && <EqBars />}
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                compact && styles.titleCompact,
                playing && styles.titleGap,
                { color: theme.colors.text },
              ]}
            >
              {title}
            </Text>
          </View>
          {/* 副行四段固定顺序：平台角标 → 音质角标 → 歌手 → 专辑；角标不缩，放不下先舍专辑再截歌手 */}
          <View style={styles.subRow}>
            <SrcBadge label={sourceLabel} tint={sourceTint ?? theme.colors.text3} />
            {qualityLabel ? <QTag label={qualityLabel} style={styles.subGap} /> : null}
            {artist.length > 0 && (
              <>
                <View
                  style={[styles.sep, styles.subGap, { backgroundColor: theme.colors.lineStrong }]}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.artist, styles.subGap, { color: theme.colors.text3 }]}
                >
                  {artist}
                </Text>
              </>
            )}
            {album != null && album.length > 0 && (
              <>
                <View
                  style={[styles.sep, styles.subGap, { backgroundColor: theme.colors.lineStrong }]}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.album, styles.subGap, { color: theme.colors.text3 }]}
                >
                  {album}
                </Text>
              </>
            )}
          </View>
        </View>
        <View style={[styles.right, styles.rowGap]}>
          {durationText != null && (
            <Text style={[styles.duration, { color: theme.colors.text3 }]}>{durationText}</Text>
          )}
          {onMore != null && (
            <Pressable
              onPress={onMore}
              hitSlop={MORE_HIT_SLOP}
              style={[styles.more, durationText != null && styles.rightGap]}
            >
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
      </Pressable>
    )
  },
)

SongRow.displayName = 'NewUISongRow'

const styles = StyleSheet.create({
  root: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.control,
    // 1px 内描边用透明 border 占位（CSS inset shadow 不占布局），避免 active 切换时跳动
    borderWidth: 1,
    borderColor: 'transparent',
  },
  /** 只有正在播的行需要裁切（渐变底贴圆角），普通行省掉裁剪路径 */
  rootActive: {
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
  /** 行内横向节奏：等效原 gap，改成子项 margin 以省掉 Yoga gap 的逐子项计算 */
  rowGap: {
    marginLeft: SONG_ROW.gap,
  },
  titleGap: {
    marginLeft: SPACING.s,
  },
  subGap: {
    marginLeft: SONG_ROW.subGap,
  },
  rightGap: {
    marginLeft: SPACING.sm,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: SONG_ROW.subMarginTop,
    overflow: 'hidden',
  },
  /** 1×9 分隔条，不参与收缩 */
  sep: {
    width: SONG_ROW.sepWidth,
    height: SONG_ROW.sepHeight,
    flexShrink: 0,
  },
  /** 正常截尾 */
  artist: {
    flexShrink: SONG_ROW.artistFlexShrink,
    fontSize: FONT_SIZE.captionLg,
  },
  /** 宽度不足时先被挤没 */
  album: {
    flexShrink: SONG_ROW.albumFlexShrink,
    fontSize: FONT_SIZE.captionLg,
  },
  right: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontSize: FONT_SIZE.captionLg,
    fontVariant: ['tabular-nums'],
  },
  more: {
    padding: SONG_ROW.morePadding,
  },
})
