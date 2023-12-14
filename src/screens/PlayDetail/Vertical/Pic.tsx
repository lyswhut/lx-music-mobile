import { memo, useState } from 'react'
import { View } from 'react-native'
// import { useLayout } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { BorderRadius } from '@/theme'
import { useWindowSize } from '@/utils/hooks'
import Text from '@/components/common/Text'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear } from '@/navigation'
import StatusBar from '@/components/common/StatusBar'
import { HEADER_HEIGHT } from './components/Header'
import Image from '@/components/common/Image'

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

export default ({ componentId }: { componentId: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const { width: winWidth, height: winHeight } = useWindowSize()

  const [animated, setAnimated] = useState(false)

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })
  // console.log('render pic')

  const imgWidth = Math.min(winWidth * 0.8, (winHeight - StatusBar.currentHeight - HEADER_HEIGHT) * 0.5)

  return (
    <View style={styles.container}>
      <View style={{ ...styles.content, elevation: animated ? 3 : 0 }}>
        {
          musicInfo.pic
            ? (
                <Image url={musicInfo.pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={{
                  ...styles.img,
                  width: imgWidth,
                  height: imgWidth,
                  borderRadius: 2,
                }} />
              )
            : <EmptyPic width={imgWidth} />
        }
      </View>
    </View>
  )
}

const styles = createStyle({
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
