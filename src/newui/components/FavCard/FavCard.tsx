import { memo } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { usePressFx } from '@/newui/hooks/usePressFx'
import { FAV_DUO, MINE, useTheme, type ThemeScheme } from '@/newui/theme'

import { Icon, type IconName } from '../Icon'

/** 两半的无障碍说明（原型 renderMinePage L1290 / L1301 的 aria-label 逐字） */
const ARIA = {
  love: '打开「我喜欢」',
  offline: '打开「已缓存」',
} as const

/** 两档配色的形状一致，取其中一档的联合类型即可 */
type FavDuoPalette = typeof FAV_DUO.palette[ThemeScheme]

export interface FavCardProps {
  /** 左半标题（.fc-half h3，原型「我喜欢」） */
  loveTitle: string
  /** 左半副行（「N 首」/ 空收藏那句；单行省略） */
  loveSub: string
  /** 右半标题（原型「已缓存」） */
  offlineTitle: string
  /** 右半副行（「N 首 · X MB」/ 空态长句；单行省略） */
  offlineSub: string
  onLovePress?: () => void
  onOfflinePress?: () => void
}

/**
 * 「我喜欢 / 已缓存」合一卡（件 `parts/mine/fav-card` U44 + `parts/mine/offline` U86；
 * 样式源 styles.css L554-L577，装配源 app.js renderMinePage L1265-1317）。
 *
 * 一张整宽卡：24 圆角渐变底（深色 #3A1B30→#241C45 / 明亮 #FDE2EE→#D6C3F9），中间一道 4px 斜线
 * 切成左右两半——**斜的是线，不是命中边界**，两半仍是左右两个矩形按钮（各自 role=button）。
 * 每半 = 44 实心图标框（heartSolid / phoneSolid，22 图标）+ 标题 / 副行（都单行省略）；
 * 副行只留名词与数字，原先「N 首 · 三首歌名」那串预览与那颗直接开播的圆钮本轮一起撤掉。
 * 整卡按压缩到 .99：两半任一按下都缩整卡（缩放挂在阴影载体上，不做 hover）。
 *
 * 纯展示组件：文案与动作由容器传入，收藏数 / 缓存数都在页面拼。
 * 备注：原型 .fc-art 的 backdrop-filter blur(4) 在 44dp 的小方块上不迁移，保留半透明底即可；
 * 浅色档没有 inset 描边（palette.ringColor 取 transparent，那一层照常渲染、视觉为零）。
 */
export const FavCard = memo(
  ({ loveTitle, loveSub, offlineTitle, offlineSub, onLovePress, onOfflinePress }: FavCardProps) => {
    const theme = useTheme()
    const palette = FAV_DUO.palette[theme.scheme]
    /**
     * 两半任一按下都缩整卡（`.fav-card:active{transform:scale(.99)}`，styles.css L560）；
     * 时长走 `.fav-card{transition:transform .25s ease}`（L558，本族唯一 .25s 档）。
     * 缩放挂在阴影载体上，不做 hover；载体本来就是 View，不额外包容器。
     */
    const pressFx = usePressFx({ scale: FAV_DUO.pressScale, duration: FAV_DUO.pressMs })

    return (
      <Animated.View
        style={[
          styles.carrier,
          {
            backgroundColor: palette.surface,
            shadowColor: palette.shadowColor,
            shadowOpacity: palette.shadowOpacity,
          },
          pressFx.animatedStyle,
        ]}
      >
        {/* 渐变底 + 24 圆角裁切：两半与那道斜线都在这层里 */}
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
            onPressIn={pressFx.onPressIn}
            onPressOut={pressFx.onPressOut}
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
            onPressIn={pressFx.onPressIn}
            onPressOut={pressFx.onPressOut}
          />

          {/* .fav-duo::after：那道斜线只是分隔（pointer-events:none），z-index 1，压在两半之下 */}
          <View
            pointerEvents="none"
            style={[styles.divider, { backgroundColor: palette.dividerColor }]}
          />
          {/* inset 0 0 0 1px 内描边（浅色档 transparent） */}
          <View pointerEvents="none" style={[styles.ring, { borderColor: palette.ringColor }]} />
        </View>
      </Animated.View>
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
  /** 无障碍说明（「打开「我喜欢」」/「打开「已缓存」」） */
  label: string
  onPress?: () => void
  onPressIn: () => void
  onPressOut: () => void
}

/** 卡里的一整半：图标框 + 标题 / 副行；两半共用同一套几何（U44 件头：U86 不补右半专属样式） */
const FavHalf = memo(({
  palette,
  icon,
  iconColor,
  title,
  sub,
  label,
  onPress,
  onPressIn,
  onPressOut,
}: FavHalfProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    onPressIn={onPressIn}
    onPressOut={onPressOut}
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
   * 阴影 + 限宽载体：外阴影 0 8 24（深浅两档只在颜色/浓度上不同），
   * 宽 100% / Pad 档 max-width 620（原型 `.pad .fav-card`）。底色由 palette.surface 在渲染期给。
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
  /** .fav-card：横向两半、上下 16 内衬、24 圆角裁切 */
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: FAV_DUO.paddingVertical,
    borderRadius: FAV_DUO.radius,
    overflow: 'hidden',
  },
  /** .fav-duo .fc-half：flex 1 1 50% / min-width 0 / 左 20 右 16 内衬 / z-index 2 */
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
   * .fav-card .fc-art：44 方 / 圆角 14 / 居中一颗 22 图标 / 不参与收缩。
   * 底照常渲染半透明托底（palette.artBg：深色 rgba(255,255,255,.11) / 明亮 rgba(255,255,255,.7)，
   * 渲染期在 FavHalf 里给）；投影只走 iOS 的 shadow*（原型 .fc-art box-shadow:0 2px 8px），
   * **Android 不给 elevation**：Android 的 elevation 阴影画在 View 背景「下面」，
   * 而这层底是半透明的 → 黑阴影会被透出来，托底发灰、并有一块硬边白斑压在图标上
   * （2026-10 用户截图）。原型 CSS 的外阴影不画在自己的背景下面，
   * 所以两档在 Android 上都是「半透明托底 + 不带 elevation」。
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
  /** 文字列：标题在上、副行在下（row-gap 2），两行都单行省略 */
  text: {
    flex: 1,
    minWidth: 0,
    gap: FAV_DUO.rowGap,
  },
  /** .fav-card h3：16 / 700 / 字距 .5 */
  title: {
    fontSize: FAV_DUO.titleSize,
    fontWeight: FAV_DUO.titleWeight,
    letterSpacing: FAV_DUO.titleLetterSpacing,
  },
  /** .fav-card p：12 / 500 */
  sub: {
    fontSize: FAV_DUO.subSize,
    fontWeight: FAV_DUO.subWeight,
  },
  /** .fav-duo::after：4px 实心线，left 50% 后左移半宽（translateX(-50%) 的等价），rotate 18deg */
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
  /** 卡面 1px 内描边层（原型 box-shadow 的 inset 那一半） */
  ring: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    borderWidth: 1,
    borderRadius: FAV_DUO.radius,
  },
})
