import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import {
  DAILY_CARD,
  FONT_SIZE,
  FONT_WEIGHT,
  LETTER_SPACING,
  RADIUS,
  useTheme,
} from '@/newui/theme'
import { withAlpha } from '@/newui/utils'

import { Art } from '../Art'

export interface DailyCardProps {
  /** 眉标（.dc-kicker，主色宽字距），原型为「FOR YOU」 */
  kicker: string
  /** 主标题（h3） */
  title: string
  /** 说明行（p），写清这批歌从哪来 */
  sub: string
  /** 右上角日期胶囊文案（.date，如「10/08」） */
  date: string
  /** 封面种子 */
  artSeed: string
  /** 封面图地址；无图时由种子画程序化底 */
  artUri?: string
  onPress?: () => void
}

/**
 * 每日推荐卡（对应原型 .daily-card，styles.css L216-229）：左封右文 + 主色辉光 + 日期胶囊。
 * 纯展示组件；「今天推哪些歌」与点击后的播放动作由容器接线。
 */
export const DailyCard = memo(
  ({ kicker, title, sub, date, artSeed, artUri, onPress }: DailyCardProps) => {
    const theme = useTheme()
    return (
      <Pressable
        style={({ pressed }) => [
          styles.root,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.line },
          pressed && styles.pressed,
        ]}
        onPress={onPress}
      >
        {/* .dc-art：98×98 贴着卡片左沿，只把右侧两个角圆掉（border-radius:0 var(--r-l) var(--r-l) 0） */}
        <View style={styles.artWrap}>
          <Art
            width={DAILY_CARD.artSize}
            height={DAILY_CARD.artSize}
            radius={0}
            seed={artSeed}
            imageUri={artUri}
          />
        </View>
        <View style={styles.body}>
          <Text style={[styles.kicker, { color: theme.colors.brand }]}>{kicker}</Text>
          <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          <Text numberOfLines={1} style={[styles.sub, { color: theme.colors.text3 }]}>
            {sub}
          </Text>
        </View>
        {/* .dc-glow：原型为 radial-gradient，RN 用右下→左上的主色渐变近似。
            渐隐终点必须写「同一基色的零透明」而非 CSS 'transparent'：
            Android LinearGradient 把 'transparent' 当 rgba(0,0,0,0)，主色插值到纯黑中途糊出黑块
            （同 LyricList 2026-10-11 真机踩坑结论） */}
        <LinearGradient
          colors={[withAlpha(theme.colors.brand, 0.3), withAlpha(theme.colors.brand, 0)]}
          start={{ x: 1, y: 1 }}
          end={{ x: 0.35, y: 0.2 }}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.date, { backgroundColor: theme.colors.fill2, borderColor: theme.colors.line }]}>
          <Text style={[styles.dateText, { color: theme.colors.text2 }]}>{date}</Text>
        </View>
      </Pressable>
    )
  },
)

DailyCard.displayName = 'NewUIDailyCard'

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DAILY_CARD.gap,
    height: DAILY_CARD.height,
    paddingRight: DAILY_CARD.padding,
    borderRadius: RADIUS.l,
    borderWidth: 1,
    overflow: 'hidden',
  },
  /** .daily-card:active 无缩放定义，这里给轻微反馈 */
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  /** .dc-art 容器：卡片 overflow 已经切掉左侧直角，这里补右侧圆角 */
  artWrap: {
    height: DAILY_CARD.height,
    borderTopRightRadius: RADIUS.l,
    borderBottomRightRadius: RADIUS.l,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  /** .dc-kicker 11px / 800 / letter-spacing 1.6px / 主色 */
  kicker: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.extraBold,
    letterSpacing: LETTER_SPACING.kickerWide,
  },
  /** h3 18px / 900（原型未加字距） */
  title: {
    marginTop: DAILY_CARD.titleMarginTop,
    fontSize: FONT_SIZE.heading,
    fontWeight: FONT_WEIGHT.black,
  },
  /** p 12px / text-3 */
  sub: {
    marginTop: DAILY_CARD.subMarginTop,
    fontSize: FONT_SIZE.small,
  },
  /** .date：右上胶囊（底与描边均走主题，原型为 rgba(255,255,255,.07) + --line） */
  date: {
    position: 'absolute',
    top: DAILY_CARD.dateTop,
    right: DAILY_CARD.dateRight,
    paddingVertical: DAILY_CARD.datePaddingY,
    paddingHorizontal: DAILY_CARD.datePaddingX,
    borderRadius: RADIUS.tag,
    borderWidth: 1,
  },
  dateText: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.extraBold,
  },
})
