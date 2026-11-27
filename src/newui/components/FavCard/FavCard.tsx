import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { FAV_DUO, MINE, useTheme, type ThemeScheme } from '@/newui/theme'

import { Icon, type IconName } from '../Icon'

/** 两半的无障碍说明 */
const ARIA = {
  love: '打开「我喜欢」',
  offline: '打开「已缓存」',
} as const

/** 两档配色的形状一致，取其中一档的联合类型即可 */
type FavDuoPalette = typeof FAV_DUO.palette[ThemeScheme]

export interface FavCardProps {
  /** 左半标题 */
  loveTitle: string
  /** 左半副行，单行省略 */
  loveSub: string
  /** 右半标题 */
  offlineTitle: string
  /** 右半副行，单行省略 */
  offlineSub: string
  onLovePress?: () => void
  onOfflinePress?: () => void
}

/**
 * 「我喜欢 / 已缓存」合一卡：整宽渐变底，中间 4px 斜线只作分隔，
 * 两半各自是矩形按钮（图标框 + 标题 / 副行）。纯展示组件，文案与动作由容器传入。
 */
export const FavCard = memo(
  ({ loveTitle, loveSub, offlineTitle, offlineSub, onLovePress, onOfflinePress }: FavCardProps) => {
    const theme = useTheme()
    const palette = FAV_DUO.palette[theme.scheme]
    return (
      <View
        style={[
          styles.carrier,
          {
            backgroundColor: palette.surface,
            shadowColor: palette.shadowColor,
            shadowOpacity: palette.shadowOpacity,
          },
        ]}
      >
        {/* 渐变底 + 圆角裁切：两半与斜线都在这层里 */}
        <View style={styles.card}>
          <LinearGradient
            colors={[...palette.gradient.colors]}
            start={palette.gradient.start}
            end={palette.gradient.end}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />

          {/* 左半「我喜欢」 */}
          <FavHalf
            palette={palette}
            icon="heartSolid"
            iconColor={palette.loveIcon}
            title={loveTitle}
            sub={loveSub}
            label={ARIA.love}
            onPress={onLovePress}
          />

          {/* 右半「已缓存」 */}
          <FavHalf
            palette={palette}
            icon="phoneSolid"
            iconColor={palette.offlineIcon}
            title={offlineTitle}
            sub={offlineSub}
            label={ARIA.offline}
            onPress={onOfflinePress}
          />

          {/* 斜线只作分隔，压在两半之下 */}
          <View
            pointerEvents="none"
            style={[styles.divider, { backgroundColor: palette.dividerColor }]}
          />
          {/* 1px 内描边（浅色档 transparent） */}
          <View pointerEvents="none" style={[styles.ring, { borderColor: palette.ringColor }]} />
        </View>
      </View>
    )
  },
)

FavCard.displayName = 'NewUIFavCard'

interface FavHalfProps {
  palette: FavDuoPalette
  icon: IconName
  iconColor: string
  title: string
  sub: string
  /** 无障碍说明 */
  label: string
  onPress?: () => void
}

/** 卡里的一整半：图标框 + 标题 / 副行，两半共用同一套几何 */
const FavHalf = memo(({
  palette,
  icon,
  iconColor,
  title,
  sub,
  label,
  onPress,
}: FavHalfProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    style={styles.half}
  >
    <View
      style={[
        styles.art,
        {
          backgroundColor: palette.artBg,
          shadowColor: palette.artShadowColor,
          shadowOpacity: palette.artShadowOpacity,
        },
      ]}
    >
      <Icon name={icon} size={FAV_DUO.artIcon} color={iconColor} />
    </View>
    <View style={styles.text}>
      <Text numberOfLines={1} style={[styles.title, { color: palette.titleColor }]}>
        {title}
      </Text>
      <Text numberOfLines={1} style={[styles.sub, { color: palette.subColor }]}>
        {sub}
      </Text>
    </View>
  </Pressable>
))

FavHalf.displayName = 'NewUIFavHalf'

const styles = StyleSheet.create({
  /**
   * 阴影 + 限宽载体（Pad 档 max-width）；底色渲染期由 palette.surface 给。
   */
  carrier: {
    width: '100%',
    maxWidth: MINE.favMaxWidth,
    marginTop: FAV_DUO.marginTop,
    borderRadius: FAV_DUO.radius,
    shadowOffset: { width: 0, height: FAV_DUO.shadowOffsetY },
    shadowRadius: FAV_DUO.shadowRadius,
    elevation: FAV_DUO.shadowElevation,
  },
  /** 横向两半、上下内衬、圆角裁切 */
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: FAV_DUO.paddingVertical,
    borderRadius: FAV_DUO.radius,
    overflow: 'hidden',
  },
  /** 单半：flex 1 / minWidth 0 / 左右内衬 / z-index 2 */
  half: {
    flex: 1,
    minWidth: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: FAV_DUO.columnGap,
    paddingLeft: FAV_DUO.halfPaddingLeft,
    paddingRight: FAV_DUO.halfPaddingRight,
  },
  /**
   * 图标框：半透明托底（渲染期由 FavHalf 给）、投影只走 iOS 的 shadow*。
   * **Android 不给 elevation**：它会画在 View 背景之下，从半透明底里透出黑阴影，托底发灰且有硬边白斑。
   */
  art: {
    width: FAV_DUO.artSize,
    height: FAV_DUO.artSize,
    borderRadius: FAV_DUO.artRadius,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowOffset: { width: 0, height: FAV_DUO.artShadowOffsetY },
    shadowRadius: FAV_DUO.artShadowRadius,
  },
  /** 文字列：标题在上、副行在下，均单行省略 */
  text: {
    flex: 1,
    minWidth: 0,
    gap: FAV_DUO.rowGap,
  },
  title: {
    fontSize: FAV_DUO.titleSize,
    fontWeight: FAV_DUO.titleWeight,
    letterSpacing: FAV_DUO.titleLetterSpacing,
  },
  sub: {
    fontSize: FAV_DUO.subSize,
    fontWeight: FAV_DUO.subWeight,
  },
  /** 斜线：4px 实心线，left 50% 后左移半宽，rotate 18deg */
  divider: {
    position: 'absolute',
    top: FAV_DUO.dividerSpan,
    bottom: FAV_DUO.dividerSpan,
    left: FAV_DUO.dividerLeft,
    zIndex: 1,
    width: FAV_DUO.dividerWidth,
    marginLeft: -FAV_DUO.dividerWidth / 2,
    borderRadius: FAV_DUO.dividerRadius,
    transform: [{ rotate: FAV_DUO.dividerRotate }],
  },
  /** 卡面 1px 内描边层 */
  ring: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    borderWidth: 1,
    borderRadius: FAV_DUO.radius,
  },
})
