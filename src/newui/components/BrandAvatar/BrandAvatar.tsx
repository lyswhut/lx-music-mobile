import { memo } from 'react'
import { Image, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { BRAND_AVATAR, FONT_WEIGHT, GRADIENTS, RADIUS, useTheme } from '@/newui/theme'

export interface BrandAvatarProps {
  /** 直径（px）；传 BRAND_AVATAR.top.size / BRAND_AVATAR.mine.size / AVATAR_ROW.previewSize */
  size: number
  /** 首字字号；传对应 preset 的 textSize */
  textSize: number
  /** 首字文本（昵称首字，原型 renderProfile 让三处头像恒为同一个字） */
  text: string
  /**
   * 头像图的本机文件路径（原型 state.avatar，app.js paintAvatar L1235-1243）。
   * 有图就铺满整个圆，没图才走渐变首字——任何位点都不自己猜，换一次三处一起变。
   */
  imageUri?: string | null
  /**
   * 首字文本的补充样式。缺省字重 extraBold（原型 .avatar 800 / .mh-art b 900 的归一档，见文件末注释）；
   * 「修改」浮层的预览要另一档（原型 .av-preview 的 font-weight:900 / letter-spacing:.5，
   * styles.css L1095），那两条数值归浮层自己那条规则，由调用方经这里给，本件不自作判断。
   */
  textStyle?: StyleProp<TextStyle>
  style?: StyleProp<ViewStyle>
}

/**
 * RN `Image` 加载本机文件要 `file://` 前缀（裸绝对路径在 Android 侧没有 scheme），
 * 与旧 UI 的 common/Image.tsx L49、core/init/common.ts L25 同一处理。
 * 存的仍是裸路径（existsFile / unlink 认的是它），只在这一层补前缀。
 */
const toImageSource = (uri: string) => ({ uri: uri.startsWith('/') ? 'file://' + uri : uri })

/**
 * 品牌头像共通件（原型 .avatar-btn .avatar 与 .mh-art 的合一实现，styles.css L96-101 / L354-356）：
 * 品牌粉→紫对角渐变圆底 + 1px 高光描边 + 居中白色粗体首字；有头像图时换成铺满整个圆的一张图。
 * 顶栏（TopBar）、「我的」页头部（MineHeader）与「修改」浮层的预览三处共用，
 * 三处只按 preset 传直径与字号，渐变 / 字色 / 描边一套 token 说了算
 * ——修 2026-10-12 走查现象 1「两处头像样式不一致」。
 * 2026-10-24 头像可上传后仍是同一个件：原型 paintAvatar 就是「有图塞 img、没图塞首字」，
 * 图走 `<Image>` 圆裁 cover（styles.css L1100 `.avatar img,.mh-art img` 的 width/height 100% +
 * object-fit:cover；圆角由本件的 overflow:hidden 承担，与原型 border-radius:inherit 等效），
 * 渐变底始终留着——它是图片解码前的占位底，也是文件读不出来时的兜底（原型 .avatar 的 background 同理）。
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
  /** 原型 .avatar / .mh-art b 均为特粗体（800/900 归一到 extraBold）；浮层预览要 900 时由 textStyle 覆写 */
  text: {
    fontWeight: FONT_WEIGHT.extraBold,
  },
})
