import { memo } from 'react'
import { Image, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { BRAND_AVATAR, FONT_WEIGHT, GRADIENTS, RADIUS, useTheme } from '@/newui/theme'

export interface BrandAvatarProps {
  /** 直径（px）；传 BRAND_AVATAR.top.size / BRAND_AVATAR.mine.size / AVATAR_ROW.previewSize */
  size: number
  /** 首字字号；传对应 preset 的 textSize */
  textSize: number
  /** 首字文本（昵称首字，三处头像恒为同一个字） */
  text: string
  /**
   * 头像图的本机文件路径；有图就铺满整个圆，没图才走渐变首字——换一次三处一起变。
   */
  imageUri?: string | null
  /**
   * 首字文本的补充样式。缺省字重 extraBold；「修改」浮层的预览要另一档，
   * 由调用方经这里覆写，本件不自作判断。
   */
  textStyle?: StyleProp<TextStyle>
  style?: StyleProp<ViewStyle>
}

/**
 * RN `Image` 加载本机文件要 `file://` 前缀（Android 侧裸绝对路径没有 scheme）。
 * 存的仍是裸路径（existsFile / unlink 认的是它），只在这一层补前缀。
 */
const toImageSource = (uri: string) => ({ uri: uri.startsWith('/') ? 'file://' + uri : uri })

/**
 * 品牌头像共通件：品牌粉→紫对角渐变圆底 + 1px 高光描边 + 居中白色粗体首字；
 * 有头像图时换成铺满整个圆的一张图，渐变底留着作解码前占位与兜底。
 * 纯展示组件，点击包裹（Pressable）由使用方负责。
 */
export const BrandAvatar = memo(({
  size,
  textSize,
  text,
  imageUri,
  textStyle,
  style,
}: BrandAvatarProps) => {
  const theme = useTheme()
  const hasImage = imageUri != null && imageUri.length > 0
  return (
    <View
      style={[
        styles.root,
        {
          width: size,
          height: size,
          borderRadius: RADIUS.full,
          borderWidth: BRAND_AVATAR.ringWidth,
          borderColor: theme.colors.lineStrong,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[theme.colors.brand, theme.colors.brand2]}
        start={GRADIENTS.art.start}
        end={GRADIENTS.art.end}
        style={StyleSheet.absoluteFill}
      />
      {hasImage
        ? (
            <Image
              source={toImageSource(imageUri)}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          )
        : (
            <Text
              numberOfLines={1}
              style={[
                styles.text,
                {
                  color: theme.colors.onGradient,
                  fontSize: textSize,
                  lineHeight: textSize * 1.2,
                },
                textStyle,
              ]}
            >
              {text.slice(0, 1)}
            </Text>
          )}
    </View>
  )
})

BrandAvatar.displayName = 'NewUIBrandAvatar'

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  /** 特粗体（extraBold）；浮层预览要 900 时由 textStyle 覆写 */
  text: {
    fontWeight: FONT_WEIGHT.extraBold,
  },
})
