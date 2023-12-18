import { type ComponentProps } from 'react'
import { Text, type TextProps as _TextProps, StyleSheet, Animated, type ColorValue, type TextStyle } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { setSpText } from '@/utils/pixelRatio'
import { useAnimateColor } from '@/utils/hooks/useAnimateColor'
import { DEFAULT_DURATION, useAnimateNumber } from '@/utils/hooks/useAnimateNumber'
// import { AppColors } from '@/theme'

export interface TextProps extends _TextProps {
  /**
   * 字体大小
   */
  size?: number
  /**
   * 字体颜色
   */
  color?: ColorValue
}

// const warpText = <P extends TextProps>(Component: ComponentType<TextProps>) => {
//   return ({ style, size = 15, color, children, ...props }: P) => {
//     const theme = useTheme()
//     return (
//       <Component
//         style={StyleSheet.compose({ fontFamily: 'System', fontSize: setSpText(size), color: color ?? theme['c-font'] }, style)}
//         {...props}
//       >{children}</Component>
//     )
//   }
// }

export default ({ style, size = 15, color, children, ...props }: TextProps) => {
  const theme = useTheme()

  return (
    <Text
      style={StyleSheet.compose({ fontFamily: 'System', fontSize: setSpText(size), color: color ?? theme['c-font'] }, style)}
      {...props}
    >{children}</Text>
  )
}

export interface AnimatedTextProps extends _AnimatedTextProps {
  /**
   * 字体大小
   */
  size?: number
  /**
   * 字体颜色
   */
  color?: ColorValue
}
export const AnimatedText = ({ style, size = 15, color, children, ...props }: AnimatedTextProps) => {
  const theme = useTheme()

  return (
    <Animated.Text
      style={StyleSheet.compose({ fontFamily: 'System', fontSize: setSpText(size), color: color ?? theme['c-font'] }, style as TextStyle)}
      {...props}
    >{children}</Animated.Text>
  )
}


type _AnimatedTextProps = ComponentProps<(typeof Animated)['Text']>
export interface AnimatedColorTextProps extends _AnimatedTextProps {
  /**
   * 字体大小
   */
  size?: number
  /**
   * 字体颜色
   */
  color?: string
  /**
   * 字体透明度
   */
  opacity?: number
}
export const AnimatedColorText = ({ style, size = 15, opacity: _opacity, color: _color, children, ...props }: AnimatedColorTextProps) => {
  const theme = useTheme()

  const [color] = useAnimateColor(_color ?? theme['c-font'])
  const [opacity] = useAnimateNumber(_opacity ?? 1, DEFAULT_DURATION, false)

  return (
    <Animated.Text
      style={StyleSheet.compose({ fontSize: setSpText(size), color: color as unknown as ColorValue, opacity }, style as TextStyle)}
      {...props}
    >{children}</Animated.Text>
  )
}
