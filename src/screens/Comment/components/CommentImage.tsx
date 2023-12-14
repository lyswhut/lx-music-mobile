import { useEffect, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import Image, { getSize } from '@/components/common/Image'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { BorderWidths } from '@/theme'
import { useTheme } from '@/store/theme/hook'

const MAX_IMAGE_HEIGHT = scaleSizeH(260)


export default ({ url, maxWidth }: { url: string, maxWidth: number }) => {
  const [show, setShow] = useState(false)
  const [wh, setWH] = useState({ width: 0, height: 0 })
  const theme = useTheme()

  useEffect(() => {
    getSize(url, (realWidth, realHeight) => {
      let w = 0
      let h = 0

      if (w && !h) {
        h = realHeight * (w / realWidth)
      } else if (!w && h) {
        w = realWidth * (h / realHeight)
      } else {
        if (maxWidth && realWidth > maxWidth) {
          w = maxWidth
          h = realHeight * (w / realWidth)

          if (MAX_IMAGE_HEIGHT && h > MAX_IMAGE_HEIGHT) {
            w = realWidth * (MAX_IMAGE_HEIGHT / realHeight)
            h = MAX_IMAGE_HEIGHT
          }
        } else if (MAX_IMAGE_HEIGHT && realHeight > MAX_IMAGE_HEIGHT) {
          w = realWidth * (h / realHeight)
          h = MAX_IMAGE_HEIGHT
        }
      }
      setWH({ width: w || realWidth, height: h || realHeight })
    })
  }, [maxWidth, url])

  return (
    wh.width ? (
      <View style={{ height: wh.height, width: wh.width }}>
        {
          show ? (<Image
            url={url}
            style={{ height: wh.height, width: wh.width, borderWidth: BorderWidths.normal, borderColor: theme['c-border-background'] }}
          />) : (
            <TouchableOpacity style={{ ...styles.defaultPic, borderColor: theme['c-border-background'], backgroundColor: theme['c-primary-light-200-alpha-900'] }} onPress={() => { setShow(true) }}>
              <Text size={13} color={theme['c-primary-font-hover']}>{global.i18n.t('comment_show_image')}</Text>
            </TouchableOpacity>
          )
        }
      </View>
    ) : null
  )
}

const styles = createStyle({
  defaultPic: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BorderWidths.normal,
    borderStyle: 'dashed',
  },
})
