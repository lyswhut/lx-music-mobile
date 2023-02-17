import React, { memo, useState } from 'react'
import { View, Image, StyleSheet } from 'react-native'
// import { useLayout } from '@/utils/hooks'
import { useTheme } from '@/store/theme/hook'
import { BorderRadius } from '@/theme'
import Text from '@/components/common/Text'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useDimensions } from '@/utils/hooks'
import { useNavigationComponentDidAppear } from '@/navigation'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'

const EmptyPic = memo(({ width }: { width: number }) => {
  const theme = useTheme()
  const size = width * 0.2
  return (
    <View style={{ ...styles.emptyPic, width, height: width, backgroundColor: theme['c-primary-light-900-alpha-200'] }}>
      <Text size={size} color={theme['c-primary-light-400-alpha-200']}>L</Text>
      <Text size={size} color={theme['c-primary-light-400-alpha-200']} style={styles.text}>X</Text>
    </View>
  )
})

export default memo(({ componentId }: { componentId: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const { window: { width: winWidth, height: winHeight } } = useDimensions()

  const [animated, setAnimated] = useState(false)

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })

  const imgWidth = Math.min(winWidth * 0.6 * 0.5, winHeight * 0.5)

  return (
    <View style={styles.container}>
      <View style={{ ...styles.content, elevation: animated ? 3 : 0 }}>
        {
          musicInfo.pic
            ? (
                <Image source={{ uri: musicInfo.pic }} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} progressiveRenderingEnabled={true} borderRadius={2} style={{
                  ...styles.img,
                  width: imgWidth,
                  height: imgWidth,
                }} />
              )
            : <EmptyPic width={imgWidth} />
        }
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    // elevation: 3,
    backgroundColor: 'rgba(0,0,0,0)',
    borderRadius: 4,
  },
  img: {
    borderRadius: 4,
    // opacity: 0,
  },
  emptyPic: {
    borderRadius: BorderRadius.normal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    paddingLeft: 2,
  },
})
