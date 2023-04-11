import React from 'react'
import { Text, type TextProps as _TextProps, StyleSheet } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { setSpText } from '@/utils/pixelRatio'
// import { AppColors } from '@/theme'

export interface TextProps extends _TextProps {
  /**
   * 字体大小
   */
  size?: number
  /**
   * 字体颜色
   */
  color?: string
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

