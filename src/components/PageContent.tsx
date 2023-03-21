import React, { useEffect, useState } from 'react'
import { Dimensions, type ScaledSize, View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import ImageBackground from '@/components/common/ImageBackground'
// import { useDimensions } from '@/utils/hooks'

interface Props {
  children: React.ReactNode
}


export default ({ children }: Props) => {
  const theme = useTheme()
  // const { window } = useDimensions()
  const [wh, setWH] = useState<{ width: number | string, height: number | string }>({ width: '100%', height: Dimensions.get('screen').height })

  // 固定宽高度 防止弹窗键盘时大小改变导致背景被缩放
  useEffect(() => {
    const onChange = (event: {
      window: ScaledSize
      screen: ScaledSize
    }) => {
      setWH({ width: '100%', height: event.screen.height })
    }

    const changeEvent = Dimensions.addEventListener('change', onChange)
    return () => { changeEvent.remove() }
  }, [])
  // const handleLayout = (e: LayoutChangeEvent) => {
  //   console.log(e.nativeEvent)
  //   console.log(Dimensions.get('screen'))
  //   setWH({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
  // }
  // console.log('render page content')

  return (
    <ImageBackground
      // onLayout={handleLayout}
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
