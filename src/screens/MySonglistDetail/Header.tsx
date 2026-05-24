import { memo, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { BorderWidths } from '@/theme'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { scaleSizeW } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import Image from '@/components/common/Image'
import { useStatusbarHeight } from '@/store/common/hook'
import { useSonglistInfo } from './state'
import ActionBar from './ActionBar'
import ImagePreviewModal, { type ImagePreviewModalType } from '@/components/common/ImagePreviewModal'
import StarRating from '@/components/common/StarRating'

const IMAGE_WIDTH = scaleSizeW(70)

export default memo(({ componentId, onEdit }: {
  componentId: string
  onEdit: () => void
}) => {
  const statusBarHeight = useStatusbarHeight()
  const theme = useTheme()
  const info = useSonglistInfo()
  const imagePreviewRef = useRef<ImagePreviewModalType>(null)

  const handlePreview = () => {
    if (info.picUrl) imagePreviewRef.current?.show(info.picUrl)
  }

  return (
    <View style={{
      ...styles.container,
      paddingTop: statusBarHeight,
      borderBottomColor: theme['c-border-background'],
    }}>
      <View style={{ flexDirection: 'row', flexGrow: 0, flexShrink: 0, padding: 10 }}>
        <TouchableOpacity activeOpacity={0.7} onPress={handlePreview} style={{ ...styles.listItemImg, width: IMAGE_WIDTH, height: IMAGE_WIDTH }}>
          <Image
            nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_to_${info.id}`}
            url={info.picUrl}
            style={{ flex: 1, borderRadius: 4 }}
          />
        </TouchableOpacity>
        <View style={{ flexDirection: 'column', flexGrow: 1, flexShrink: 1, paddingLeft: 5 }}
          nativeID={NAV_SHEAR_NATIVE_IDS.songlistDetail_title}>
          <Text size={14} numberOfLines={1}>{info.name}</Text>
          <StarRating star={info.star ?? 0} size={13} />
          <View style={{ flexGrow: 0, flexShrink: 1 }}>
            <Text size={13} color={theme['c-font-label']} numberOfLines={4}>
              {info.desc || ''}
            </Text>
          </View>
        </View>
      </View>
      <ActionBar componentId={componentId} onEdit={onEdit} />
      <ImagePreviewModal ref={imagePreviewRef} />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    borderBottomWidth: BorderWidths.normal,
  },
  listItemImg: {
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'hidden',
  },
})
