import React, { useEffect, useState } from 'react'
import { Dimensions, ImageBackground, type LayoutChangeEvent, View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
// import { useDimensions } from '@/utils/hooks'

interface Props {
  children: React.ReactNode
}


export default ({ children }: Props) => {
  const theme = useTheme()
  // const { window } = useDimensions()
  const [wh, setWH] = useState<{ width: number | string, height: number | string }>({ width: '100%', height: '100%' })

  // 固定宽高度 防止弹窗键盘时大小改变导致背景被缩放
  useEffect(() => {
    const onChange = () => {
      setWH({ width: '100%', height: '100%' })
    }

    const changeEvent = Dimensions.addEventListener('change', onChange)
    return () => { changeEvent.remove() }
  }, [])
  const handleLayout = (e: LayoutChangeEvent) => {
    setWH({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
  }

  return (
    <ImageBackground
      onLayout={handleLayout}
      style={{ height: wh.height, width: wh.width, backgroundColor: theme['c-content-background'] }}
      source={theme['bg-image']}
      resizeMode="cover"
    >
      <View style={{ flex: 1, flexDirection: 'column', backgroundColor: theme['c-main-background'] }}>
        {children}
      </View>
    </ImageBackground>
  )
}
