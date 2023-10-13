import { type ComponentProps } from 'react'
import { Text, type TextProps as _TextProps, StyleSheet, Animated, type ColorValue, type TextStyle } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { setSpText } from '@/utils/pixelRatio'
import { useAnimateColor } from '@/utils/hooks/useAnimateColor'
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

export default ({ style, size = 15, color, children, ...props }: TextProps) => {
  const theme = useTheme()

  return (
    <Text
      style={StyleSheet.compose({ fontSize: setSpText(size), color: color ?? theme['c-font'] }, style)}
      {...props}
    >{children}</Text>
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
}
export const AnimatedColorText = ({ style, size = 15, color: _color, children, ...props }: AnimatedColorTextProps) => {
  const theme = useTheme()

  const [color] = useAnimateColor(_color ?? theme['c-font'])

  return (
    <Animated.Text
      style={StyleSheet.compose({ fontSize: setSpText(size), color: color as unknown as ColorValue }, style as TextStyle)}
      {...props}
    >{children}</Animated.Text>
  )
}
