import { memo } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import {
  BRAND_AVATAR,
  FONT_SIZE,
  GLASS,
  LETTER_SPACING,
  RADIUS,
  SHADOW,
  SPACING,
  TOP_BAR,
  Z_LAYER,
  useTheme,
} from '@/newui/theme'
// 直连具体 hook（不走 @/newui/hooks 桶口）
import { useWideLayout } from '@/newui/hooks/useWideLayout'

import { BrandAvatar } from '../BrandAvatar'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { BlurredContainer } from '../Glass'

export interface TopBarProps {
  /** 头像文字（昵称首字，无昵称时用品牌字；有头像图时只当兜底） */
  avatarText: string
  /** 头像图的本机文件路径；不传 = 走首字 */
  avatarImageUri?: string | null
  /** 头像入口（切到「我的」） */
  onAvatarPress?: () => void
  /** 搜索栏占位文案 */
  searchPlaceholder: string
  /** 搜索入口（点击打开搜索浮层） */
  onSearchPress?: () => void
  /**
   * 音源状态点：只表示「有事没办完」，异常才传 'warn'；
   * 不存在常驻 'ok'——绿点只是装饰。
   */
  sourceDot?: 'warn'
  /** 音源入口 */
  onSourcePress?: () => void
  /** 滚动后加投影 */
  pinned?: boolean
  /** 状态栏高度（真机实测） */
  topInset?: number
  style?: StyleProp<ViewStyle>
}

/**
 * 头像钮：34px 全圆品牌首字头像，改走共通件 BrandAvatar（与「我的」页头部同一口径）；
 * 本组件只保留可点击外壳与按压反馈。
 */
const AvatarButton = memo(
  ({ text, imageUri, onPress }: { text: string, imageUri?: string | null, onPress?: () => void }) => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}
    >
      <BrandAvatar
        size={BRAND_AVATAR.top.size}
        textSize={BRAND_AVATAR.top.textSize}
        text={text}
        imageUri={imageUri}
      />
    </Pressable>
  ),
)

AvatarButton.displayName = 'NewUITopBarAvatar'

/** .searchbar：整条是可点击的假输入框（真实搜索在浮层里输入） */
const SearchBar = memo(({ placeholder, onPress }: { placeholder: string; onPress?: () => void }) => {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="search"
      onPress={onPress}
      style={({ pressed }) => [
        styles.searchbar,
        {
          backgroundColor: theme.colors.fill2,
          borderColor: theme.colors.hairline,
        },
        pressed && styles.pressed,
      ]}
    >
      <Icon name="search" size={TOP_BAR.searchIcon} color={theme.colors.text3} />
      <Text style={[styles.placeholder, { color: theme.colors.text3 }]} numberOfLines={1}>
        {placeholder}
      </Text>
    </Pressable>
  )
})

SearchBar.displayName = 'NewUITopBarSearch'

/**
 * 吸顶头部：头像 + 搜索栏 + 音源按钮。
 * 覆盖在滚动区之上，内容上留白由 PageViewport 用同一个顶栏总高预留（两者都读 useWideLayout 的 topBarHeight）。
 * 底铺走 BlurredContainer，当前关闭真模糊（实色 + 同档染色渐变）；这一层严格限定在顶栏盒内，
 * 盒外（滚动内容区）没有任何模糊 / 染色。
 *
 * 层叠与命中：
 * 1. 遮底与 pinned 无关，pinned 只决定投影，状态变化不得改变底层层级；
 * 2. 显式抬到滚动内容之上（Z_LAYER.topbar）——只靠声明顺序压不住带 Android elevation 的卡片；
 * 3. 装饰层不吃触摸（BlurredContainer 自带 pointerEvents="none"），命中全留给盒内控件。
 */
export const TopBar = memo(
  ({
    avatarText,
    avatarImageUri,
    onAvatarPress,
    searchPlaceholder,
    onSearchPress,
    sourceDot,
    onSourcePress,
    pinned = false,
    topInset = 0,
    style,
  }: TopBarProps) => {
    /* 三条度量按档走：顶 = 实测状态栏 + 4、左右 = 22、底不变；compact 全回竖屏基线。
       盒高与滚动容器上内衬共用 topBarHeight（同一判据）。 */
    const { wide, topBarHeight } = useWideLayout()
    return (
      <View
        style={[
          styles.root,
          {
            paddingTop: topInset + (wide?.statusReserve ?? TOP_BAR.statusBarReserve),
            paddingHorizontal: wide?.topBarPaddingX ?? SPACING.lg,
            paddingBottom: TOP_BAR.paddingBottom,
            height: topBarHeight(topInset),
            zIndex: Z_LAYER.topbar,
          },
          // 投影随吸顶状态；底色不受它影响
          pinned && SHADOW.chrome,
          style,
        ]}
      >
        {/* 玻璃底（含状态栏背后那段）：真模糊 + 同档染色渐变，不可用时退回不透明 bg；两层都只铺满本盒 */}
        {/* 当前关闭真模糊：只留不透明底色 + 同档染色渐变 */}
        <BlurredContainer spec={GLASS.topBar} enabled={false} />
        <View style={styles.row}>
          <AvatarButton text={avatarText} imageUri={avatarImageUri} onPress={onAvatarPress} />
          <SearchBar placeholder={searchPlaceholder} onPress={onSearchPress} />
          <IconButton name="wave" dot={sourceDot} onPress={onSourcePress} />
        </View>
      </View>
    )
  },
)

TopBar.displayName = 'NewUITopBar'

const styles = StyleSheet.create({
  /** 三条度量按档在渲染期给 */
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: TOP_BAR.gap,
  },
  /** 外壳只留位与不收缩，圆底 / 描边 / 首字由 BrandAvatar 画 */
  avatarBtn: {
    flexShrink: 0,
  },
  searchbar: {
    flex: 1,
    height: TOP_BAR.searchHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: TOP_BAR.searchGap,
    paddingHorizontal: TOP_BAR.searchPaddingX,
    borderRadius: RADIUS.search,
    borderWidth: 1,
  },
  placeholder: {
    flexShrink: 1,
    fontSize: FONT_SIZE.body,
    letterSpacing: LETTER_SPACING.tight,
  },
  pressed: {
    transform: [{ scale: 0.9 }],
  },
})
