import React, { memo } from 'react'
import { View, Text, StyleSheet, ImageBackground } from 'react-native'
import { AppColors, BorderWidths } from '@/theme'
import { useGetter } from '@/store'
import ButtonBar from './ActionBar'

const Header = memo(() => {
  const selectListInfo = useGetter('songList', 'selectListInfo')
  const { info: listDetailDataInfo = {} } = useGetter('songList', 'listDetailData')
  const playCount = selectListInfo.play_count || listDetailDataInfo.play_count

  return (
    <View style={{ ...styles.container, borderBottomColor: AppColors.borderColor }}>
      <View style={{ flexDirection: 'row', flexGrow: 0, flexShrink: 0, padding: 10 }}>
        <View style={{ ...styles.listItemImg, backgroundColor: AppColors.primary }}>
          <ImageBackground source={{ uri: selectListInfo.img || listDetailDataInfo.img || null }} borderRadius={4} style={{ flex: 1, resizeMode: 'cover', justifyContent: 'flex-end' }}>
            {
              playCount
                ? <Text style={{ fontSize: 12, paddingLeft: 3, paddingRight: 3, backgroundColor: 'rgba(0, 0, 0, 0.5)', color: AppColors.primary, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} numberOfLines={ 1 }>{playCount}</Text>
                : null
            }
          </ImageBackground>
        </View>
        <View style={{ flexDirection: 'column', flexGrow: 1, flexShrink: 1, paddingLeft: 5 }}>
          <Text style={{ fontSize: 13, color: AppColors.normal }} numberOfLines={ 1 }>{selectListInfo.name || listDetailDataInfo.name}</Text>
          <View style={{ flexGrow: 0, flexShrink: 1 }}>
            <Text style={{ fontSize: 10, color: AppColors.normal40 }} numberOfLines={ 4 }>{selectListInfo.desc || listDetailDataInfo.desc}</Text>
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    borderBottomWidth: BorderWidths.normal,
  },
  listItemImg: {
    backgroundColor: '#eee',
    flexGrow: 0,
    flexShrink: 0,
    width: 70,
    height: 70,
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
})

export default Header
