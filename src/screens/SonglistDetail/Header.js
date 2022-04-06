import React, { memo } from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { BorderWidths } from '@/theme'
import { useGetter } from '@/store'
import ButtonBar from './ActionBar'

const Header = memo(({ animatePlayed }) => {
  const theme = useGetter('common', 'theme')
  const selectListInfo = useGetter('songList', 'selectListInfo')
  const { info: listDetailDataInfo = {} } = useGetter('songList', 'listDetailData')
  const playCount = selectListInfo.play_count || listDetailDataInfo.play_count

  return (
    <View style={{ ...styles.container, borderBottomColor: theme.borderColor }}>
      <View style={{ flexDirection: 'row', flexGrow: 0, flexShrink: 0, padding: 10 }}>
        <View style={{ ...styles.listItemImg, backgroundColor: theme.primary }}>
          <Image nativeID={`pic${selectListInfo.id}Dest`} source={{ uri: selectListInfo.img || listDetailDataInfo.img || null }} borderRadius={4} style={{ flex: 1, resizeMode: 'cover', justifyContent: 'flex-end' }} />
            {
              playCount && animatePlayed
                ? <Text style={styles.playCount} numberOfLines={ 1 }>{playCount}</Text>
                : null
            }
        </View>
        <View style={{ flexDirection: 'column', flexGrow: 1, flexShrink: 1, paddingLeft: 5 }} nativeID="title">
          <Text style={{ fontSize: 13, color: theme.normal }} numberOfLines={ 1 }>{selectListInfo.name || listDetailDataInfo.name}</Text>
          <View style={{ flexGrow: 0, flexShrink: 1 }}>
            <Text style={{ fontSize: 10, color: theme.normal40 }} numberOfLines={ 4 }>{selectListInfo.desc || listDetailDataInfo.desc}</Text>
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

export default Header
