import React, { useEffect, useState } from 'react'
import { Dimensions, View, type LayoutChangeEvent } from 'react-native'
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
    const onChange = () => {
      setWH({ width: '100%', height: '100%' })
    }

    const changeEvent = Dimensions.addEventListener('change', onChange)
    return () => {
      changeEvent.remove()
    }
  }, [])
  const handleLayout = (e: LayoutChangeEvent) => {
    // console.log('handleLayout', e.nativeEvent)
    // console.log(Dimensions.get('screen'))
    setWH({ width: e.nativeEvent.layout.width, height: Dimensions.get('screen').height })
  }
  // console.log('render page content')

  return (
    <View style={{ flex: 1, overflow: 'hidden' }} onLayout={handleLayout}>
      <ImageBackground
        style={{ position: 'absolute', left: 0, top: 0, height: wh.height, width: wh.width, backgroundColor: theme['c-content-background'] }}
        source={theme['bg-image']}
        resizeMode="cover"
      >
      </ImageBackground>
      <View style={{ flex: 1, flexDirection: 'column', backgroundColor: theme['c-main-background'] }}>
        {children}
      </View>
    </View>
  )
}
