import { Image as _Image } from 'react-native'
import FastImage, { type FastImageProps } from 'react-native-fast-image'
export type { OnLoadEvent } from 'react-native-fast-image'

export interface ImageProps extends Omit<FastImageProps, 'source'> {
  url?: string | number
}


const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
}

const Image = ({ url, resizeMode = FastImage.resizeMode.cover, ...props }: ImageProps) => {
  let uri = typeof url == 'number'
    ? _Image.resolveAssetSource(url).uri
    : url?.startsWith('/')
      ? 'file://' + url
      : url
  return (
    <FastImage
      {...props}
      source={{
        uri,
        headers: defaultHeaders,
        priority: FastImage.priority.normal,
      }}
      resizeMode={resizeMode}
    />
  )
}

export const getSize = (uri: string, success: (width: number, height: number) => void, failure?: (error: any) => void) => {
  _Image.getSize(uri, success, failure)
}
export default Image
