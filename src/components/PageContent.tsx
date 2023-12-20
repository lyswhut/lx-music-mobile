// import { useEffect, useState } from 'react'
import { Image, View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import ImageBackground from '@/components/common/ImageBackground'
import { useWindowSize } from '@/utils/hooks'
import { useEffect, useMemo, useState } from 'react'
import playerState from '@/store/player/state'
import settingState from '@/store/setting/state'
import { scaleSizeAbsHR } from '@/utils/pixelRatio'
import { defaultHeaders } from './common/Image'
import SizeView from './SizeView'

interface Props {
  children: React.ReactNode
}

const formatUri = <T extends string | null>(url: T) => {
  return (typeof url == 'string' && url.startsWith('/')) ? `file://${url}` : url
}

const BLUR_RADIUS = Math.max(scaleSizeAbsHR(24), 10)

export default ({ children }: Props) => {
  const theme = useTheme()
  const windowSize = useWindowSize()
  const [pic, setPic] = useState<string | null | undefined>(settingState.setting['theme.dynamicBg'] ? playerState.musicInfo.pic : null)
  // const [wh, setWH] = useState<{ width: number | string, height: number | string }>({ width: '100%', height: Dimensions.get('screen').height })

  // 固定宽高度 防止弹窗键盘时大小改变导致背景被缩放
  // useEffect(() => {
  //   const onChange = () => {
  //     setWH({ width: '100%', height: '100%' })
  //   }

  //   const changeEvent = Dimensions.addEventListener('change', onChange)
  //   return () => {
  //     changeEvent.remove()
  //   }
  // }, [])
  // const handleLayout = (e: LayoutChangeEvent) => {
  //   // console.log('handleLayout', e.nativeEvent)
  //   // console.log(Dimensions.get('screen'))
  //   setWH({ width: e.nativeEvent.layout.width, height: Dimensions.get('screen').height })
  // }
  // console.log('render page content')

  useEffect(() => {
    let pic = playerState.musicInfo.pic
    let isUnmounted = false
    let isDynamicBg = settingState.setting['theme.dynamicBg']
    const handlePicUpdate = () => {
      if (playerState.musicInfo.pic && playerState.musicInfo.pic != playerState.loadErrorPicUrl) {
        // if (playerState.musicInfo.pic != playerState.loadErrorPicUrl) {
        // console.log('picUpdated', playerState.musicInfo.pic)
        pic = playerState.musicInfo.pic
        if (!isDynamicBg) return
        void Image.prefetch(formatUri(playerState.musicInfo.pic)).then(() => {
          if (pic != playerState.musicInfo.pic || isUnmounted) return
          setPic(playerState.musicInfo.pic)
        }).catch(() => {
          if (isUnmounted) return
          setPic(null)
        })
      }
      // } else {
      //   if (!isDynamicBg) return
      //   setPic(null)
      // }
    }
    const handleConfigUpdate = (keys: Array<keyof LX.AppSetting>, setting: Partial<LX.AppSetting>) => {
      if (!keys.includes('theme.dynamicBg')) return
      isDynamicBg = setting['theme.dynamicBg']!
      if (isDynamicBg) {
        if (playerState.musicInfo.pic) {
          pic = playerState.musicInfo.pic
          // console.log(pic)
          setPic(pic)
        }
      } else setPic(null)
    }
    global.state_event.on('playerMusicInfoChanged', handlePicUpdate)
    global.state_event.on('configUpdated', handleConfigUpdate)
    return () => {
      isUnmounted = true
      global.state_event.off('playerMusicInfoChanged', handlePicUpdate)
      global.state_event.off('configUpdated', handleConfigUpdate)
    }
  }, [])

  const themeComponent = useMemo(() => (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <ImageBackground
        style={{ position: 'absolute', left: 0, top: 0, height: windowSize.height, width: windowSize.width, backgroundColor: theme['c-content-background'] }}
        source={theme['bg-image']}
        resizeMode="cover"
      >
      </ImageBackground>
      <View style={{ flex: 1, flexDirection: 'column', backgroundColor: theme['c-main-background'] }}>
        {children}
      </View>
    </View>
  ), [children, theme, windowSize.height, windowSize.width])
  const picComponent = useMemo(() => {
    return (
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <ImageBackground
          style={{ position: 'absolute', left: 0, top: 0, height: windowSize.height, width: windowSize.width, backgroundColor: theme['c-content-background'] }}
          source={{ uri: formatUri(pic!), headers: defaultHeaders }}
          resizeMode="cover"
          blurRadius={BLUR_RADIUS}
        >
          <View style={{ flex: 1, flexDirection: 'column', backgroundColor: theme['c-content-background'], opacity: 0.8 }}></View>
        </ImageBackground>
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {children}
        </View>
      </View>
    )
  }, [children, pic, theme, windowSize.height, windowSize.width])

  return (
    <>
      <SizeView />
      {pic ? picComponent : themeComponent}
    </>
  )
}
