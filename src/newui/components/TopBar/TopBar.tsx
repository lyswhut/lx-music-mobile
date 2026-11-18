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
// 直连具体 hook（不走 @/newui/hooks 桶口），与 PageViewport / TabBar 同一做法
import { useWideLayout } from '@/newui/hooks/useWideLayout'

import { BrandAvatar } from '../BrandAvatar'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { BlurredContainer } from '../Glass'

export interface TopBarProps {
  /** 头像文字（原型 #topAvatar 为昵称首字，无昵称时用品牌字；有头像图时只当兜底） */
  avatarText: string
  /** 头像图的本机文件路径（原型 state.avatar，paintAvatar 同时刷 #topAvatar）；不传 = 走首字 */
  avatarImageUri?: string | null
  /** 头像入口（原型 #avatarBtn：手机端切到「我的」） */
  onAvatarPress?: () => void
  /** 搜索栏占位文案（原型 .searchbar .ph） */
  searchPlaceholder: string
  /** 搜索入口（原型 #searchBtn 是按钮，点击打开搜索浮层，不是输入框） */
  onSearchPress?: () => void
  /**
   * 音源状态点（原型 .pulse-dot #castDot）：只表示「有事没办完」。
   * 原型 app.js renderNav L2451-2459：音源就绪时 `#castDot.hidden`，即整颗不渲染；
   * 没配好 / 异常才传 'warn'（琥珀点）。不存在 'ok' 档——常驻绿点只是装饰，原型已撤。
   */
  sourceDot?: 'warn'
  /** 音源入口（原型 #castBtn，图标 i-wave） */
  onSourcePress?: () => void
  /** 滚动后加投影（app.js：vp.scrollTop > 8 → .topbar.pinned） */
  pinned?: boolean
  /** 状态栏高度（真机实测，替代原型 52px 模拟状态栏） */
  topInset?: number
  style?: StyleProp<ViewStyle>
}

/**
 * .avatar-btn：34px 全圆品牌首字头像。
 * 2026-10-12 走查现象 1：改走共通件 BrandAvatar（与「我的」页头部同一渐变 / 字色 / 描边口径），
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
 * 吸顶头部（对应原型 .topbar / .topbar-row）：头像 + 搜索栏 + 音源按钮。
 * 覆盖在滚动区之上，内容上留白由 PageViewport 用同一个顶栏总高预留（两者都读 useWideLayout 的
 * `topBarHeight`，宽屏档即原型 `.wide .viewport{padding-top:92px}` 那条线，styles.css:1315）。
 * 原型是「深色 tint 渐变底 + backdrop-filter blur(22px) 毛玻璃」（styles.css L105-112）；
 * 玻璃层（共通件 `BlurredContainer`，规格 theme.GLASS.topBar）严格限定在顶栏盒内：
 * CSS backdrop-filter 的作用域即元素自身 border-box，下沿 tint 到 0 档收 Transparent 止于盒底，
 * 盒外（滚动内容区）没有任何模糊/染色。
 * 2026-10-21 QA：撤掉曾挂在盒外下方 16px 的「下沿渐隐收边条」——原型不存在这条带，
 * 它把顶栏观感向下多铺了 16px 半透明 bg，「我的」页 58px 头像顶部因此被罩住发虚
 * （todo-list「顶部工具栏…模糊的范围扩大了」）。真模糊不可用时退回不透明底色铺满
 * 顶栏盒（BlurredContainer 降级路径），同样不越盒。
 *
 * 层叠与命中（2026-10-12 走查现象 3「首页切到榜单 tab 后顶部透明，歌名压在信号栏上」，
 * 以下保证保持）：
 * 1. **遮底与 `pinned` 完全无关**——玻璃层含高 alpha 染色（顶段 .92），降级时更是整条不透明 bg；
 *    `pinned` 只决定投影，吸顶/退顶状态任何时候变化都不得改变底层层级。
 * 2. **显式抬到滚动内容之上**：`zIndex` 取 `Z_LAYER.topbar`（原型 .topbar z-index:40）。
 *    此前只靠 MainScreen 里的声明顺序压住列表，平台侧一旦按 elevation 重排（卡片带的
 *    SHADOW.card 在本机是 Android elevation），滚到顶栏后面的歌名就会爬到顶栏上面，
 *    看上去就像顶栏是透明的。
 * 3. **装饰层不吃触摸**：玻璃层（BlurredContainer 自带 pointerEvents="none"）只做背景，
 *    命中全部留给盒内的头像 / 搜索栏 / 音源按钮。
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
    /* 本盒的三条度量按档走（原型 `.wide .topbar{padding:36px 22px 10px}`，styles.css:1314）：
       顶 = 实测状态栏 + 4（36 那一位 = 本档模拟状态栏 32 + 4，见 WIDE_STRUCTURAL.statusReserve）、
       左右 = 22、底 = TOP_BAR.paddingBottom 的 10 不变；compact 三条全回竖屏基线（2 / 16 / 10）。
       盒高与滚动容器上内衬共用 topBarHeight（同一判据），故宽屏档顶栏下沿 = 原型 92 那条线。 */
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
        {/* 玻璃底（含系统状态栏背后那一段）：真模糊 blur(22) + 原型同档染色渐变
            （.topbar，styles.css L105-112；theme.GLASS.topBar），不可用时退回不透明 bg 铺底。
            两层都只铺满本盒（absoluteFill），不外溢——原型 backdrop-filter/渐变均止于盒底 */}
        <BlurredContainer spec={GLASS.topBar} />
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
  /** padding-top / 左右 / 高 三条按档在渲染期给（宽屏 36 位 = 状态栏 + 4、左右 22；竖屏 2 与 SPACING.lg 的 16） */
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  /** .topbar-row：gap 10 / height 46 */
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: TOP_BAR.gap,
  },
  /** .avatar-btn：外壳只留位与不收缩，圆底/描边/首字由 BrandAvatar 画 */
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
  /** .searchbar .ph：13px / .2 字距 */
  placeholder: {
    flexShrink: 1,
    fontSize: FONT_SIZE.body,
    letterSpacing: LETTER_SPACING.tight,
  },
  pressed: {
    transform: [{ scale: 0.9 }],
  },
})
