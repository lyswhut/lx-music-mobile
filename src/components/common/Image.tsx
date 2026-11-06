import { useTheme } from '@/store/theme/hook'
import { BorderRadius } from '@/theme'
import { createStyle } from '@/utils/tools'
import { type ComponentProps, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { View, type ViewProps, StyleSheet, Image as FastImage } from 'react-native'
// import FastImage, { type FastImageProps } from 'react-native-fast-image'
import Text from './Text'
import { useLayout } from '@/utils/hooks'
// export type { OnLoadEvent } from 'react-native-fast-image'

export interface ImageProps extends ViewProps {
  style: ComponentProps<typeof FastImage>['style']
  url?: string | number | null
  cache?: boolean
  resizeMode?: ComponentProps<typeof FastImage>['resizeMode']
  onError?: (url: string | number) => void
}


export const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
}

const EmptyPic = memo(({ style }: { style: ImageProps['style'] }) => {
  const theme = useTheme()
  const { onLayout, width } = useLayout()
  const size = width * 0.36

  return (
    <View style={StyleSheet.compose({ ...styles.emptyPic, backgroundColor: theme['c-primary-light-900-alpha-200'], gap: size * 0.1 }, style)} onLayout={onLayout}>
      <Text size={size} color={theme['c-primary-light-400-alpha-200']}>L</Text>
      <Text size={size} color={theme['c-primary-light-400-alpha-200']} style={styles.text}>X</Text>
    </View>
  )
})

const Image = memo(({ url, cache, resizeMode = 'cover', style, onError, nativeID }: ImageProps) => {
  const [isError, setError] = useState(false)
  const handleError = useCallback(() => {
    setError(true)
    onError?.(url!)
  }, [onError, url])
  useEffect(() => {
    setError(false)
  }, [url])
  let uri = typeof url == 'number'
    ? FastImage.resolveAssetSource(url).uri
    : url?.startsWith('/')
      ? 'file://' + url
      : url
  const showDefault = useMemo(() => !uri || isError, [isError, uri])
  // 外层容器承载 nativeID 且视图类型保持稳定：
  // 占位图/图片之间切换时只替换内层内容，避免共享元素转场动画期间视图被销毁导致转场悬挂或崩溃
  return (
    <View style={StyleSheet.compose(style, styles.sharedContainer)} nativeID={nativeID}>
      {
        showDefault
          ? <EmptyPic style={styles.fill} />
          : (
              <FastImage
                style={styles.fill}
                source={{
                  uri: uri!,
                  headers: defaultHeaders,
                  cache: cache === false ? 'reload' : 'force-cache',
                }}
                onError={handleError}
                resizeMode={resizeMode}
              />
            )
      }
    </View>
  )
}, (prevProps, nextProps) => {
  return prevProps.url == nextProps.url &&
    prevProps.style == nextProps.style &&
    prevProps.nativeID == nextProps.nativeID
})

export const getSize = (uri: string, success: (width: number, height: number) => void, failure?: (error: any) => void) => {
  FastImage.getSize(uri, success, failure)
}
export const clearMemoryCache = async() => {
  // return Promise.all([FastImage.clearMemoryCache(), FastImage.clearDiskCache()])
}
export default Image

const styles = createStyle({
  emptyPic: {
    borderRadius: BorderRadius.normal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    paddingLeft: 2,
  },
  // 共享元素外层容器：裁剪内容以支持圆角，并保证容器自身视图类型稳定
  sharedContainer: {
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
})
