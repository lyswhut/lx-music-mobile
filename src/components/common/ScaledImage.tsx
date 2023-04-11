import React, { useEffect, useState } from 'react'
import { Image, StyleSheet, type ImageProps } from 'react-native'

export interface ScaledImageProps extends Pick<ImageProps, 'style'> {
  uri: string
  width?: number
  height?: number
  maxWidth?: number
  maxHeight?: number
}

export default ({ uri, width, height, maxWidth, maxHeight, style }: ScaledImageProps) => {
  const [wh, setWH] = useState({ width: 0, height: 0 })

  useEffect(() => {
    Image.getSize(uri, (realWidth, realHeight) => {
      let w = width ?? 0
      let h = height ?? 0

      if (w && !h) {
        h = realHeight * (w / realWidth)
      } else if (!w && h) {
        w = realWidth * (h / realHeight)
      } else {
        if (maxWidth && realWidth > maxWidth) {
          w = maxWidth
          h = realHeight * (w / realWidth)

          if (maxHeight && h > maxHeight) {
            w = realWidth * (maxHeight / realHeight)
            h = maxHeight
          }
        } else if (maxHeight && realHeight > maxHeight) {
          w = realWidth * (h / realHeight)
          h = maxHeight
        }
      }
      setWH({ width: w || realWidth, height: h || realHeight })
    })
  }, [height, maxHeight, maxWidth, uri, width])

  return (
    <Image
      source={{ uri }}
      style={StyleSheet.compose({ height: wh.height, width: wh.width }, style)}
    />
  )
}
