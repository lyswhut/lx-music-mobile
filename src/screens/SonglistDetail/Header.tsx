import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { View, Image } from 'react-native'
import { BorderWidths } from '@/theme'
import ButtonBar from './ActionBar'
import { useNavigationComponentDidAppear } from '@/navigation'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { scaleSizeW } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import StatusBar from '@/components/common/StatusBar'
import songlistState from '@/store/songlist/state'

const IMAGE_WIDTH = scaleSizeW(70)

const Pic = ({ componentId, playCount, imgUrl }: {
  componentId: string
  playCount: string
  imgUrl?: string
}) => {
  const [animated, setAnimated] = useState(false)

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })

  return (
    <View style={{ ...styles.listItemImg, width: IMAGE_WIDTH, height: IMAGE_WIDTH }}>
      <Image nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_to_${songlistState.selectListInfo.id}`} source={{ uri: imgUrl }} borderRadius={4} style={{ flex: 1, resizeMode: 'cover', justifyContent: 'flex-end' }} />
        {
          playCount && animated
            ? <Text style={styles.playCount} numberOfLines={ 1 }>{playCount}</Text>
            : null
        }
    </View>
  )
}

export interface HeaderProps {
  componentId: string
}

export interface HeaderType {
  setInfo: (info: DetailInfo) => void
}
export interface DetailInfo {
  name: string
  desc: string
  playCount: string
  imgUrl?: string
}

export default forwardRef<HeaderType, HeaderProps>(({ componentId }: { componentId: string }, ref) => {
  const theme = useTheme()
  const [detailInfo, setDetailInfo] = useState<DetailInfo>({ name: '', desc: '', playCount: '' })

  useImperativeHandle(ref, () => ({
    setInfo(info) {
      setDetailInfo(info)
    },
  }), [])

  return (
    <View style={{ ...styles.container, paddingTop: StatusBar.currentHeight, borderBottomColor: theme['c-border-background'] }}>
      <View style={{ flexDirection: 'row', flexGrow: 0, flexShrink: 0, padding: 10 }}>
        <Pic componentId={componentId} playCount={detailInfo.playCount} imgUrl={detailInfo.imgUrl} />
        <View style={{ flexDirection: 'column', flexGrow: 1, flexShrink: 1, paddingLeft: 5 }} nativeID={NAV_SHEAR_NATIVE_IDS.songlistDetail_title}>
          <Text size={14} numberOfLines={ 1 }>{detailInfo.name}</Text>
          <View style={{ flexGrow: 0, flexShrink: 1 }}>
            <Text size={13} color={theme['c-font-label']} numberOfLines={ 4 }>{detailInfo.desc}</Text>
          </View>
        </View>
      </View>
      <ButtonBar />
      {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexGrow: 0, flexShrink: 1, paddingTop: 5, paddingRight: 5 }}>
              <Text style={{ fontSize: 12, color: AppColors.normal20 }} numberOfLines={ 1 }>{playCount || '-'}</Text>
              <Text style={{ fontSize: 12, color: AppColors.normal30 }} numberOfLines={ 1 }>{this.props.selectListInfo.author || this.props.listDetailData.info.author}</Text>
            </View>
      </View> */}
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
    // backgroundColor: '#eee',
    flexGrow: 0,
    flexShrink: 0,
    // width: 70,
    // height: 70,
    // ...Platform.select({
    //   ios: {
    //     shadowColor: '#000',
    //     shadowOffset: {
    //       width: 0,
    //       height: 1,
    //     },
    //     shadowOpacity: 0.20,
    //     shadowRadius: 1.41,
    //   },
    //   android: {
    //     elevation: 2,
    //   },
    // }),
  },
  playCount: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    fontSize: 12,
    paddingLeft: 3,
    paddingRight: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#fff',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
})
