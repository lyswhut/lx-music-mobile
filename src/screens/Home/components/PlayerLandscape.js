import React from 'react'
import { View, ScrollView, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'
import Button from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { AppColors } from '@/theme'

export default ({
  asideWidth, targetMusic, toggleNextPlayMode,
  togglePlay, playIcon, playModeIcon, actions,
  menu, homeViewPageIndex, onLayout = () => {}, navPress = () => {},
}) => {
  const navBtnWidth = asideWidth * 0.5 - 0.1
  const imgWidth = asideWidth * 0.3
  const paddingBottom = asideWidth * 0.05
  const btnStyle = {
    width: asideWidth * 0.3,
    height: asideWidth * 0.32,
    lineHeight: asideWidth * 0.32,
  }
  const navIconSize = asideWidth * 0.15
  const iconSize = asideWidth * 0.15

  return <View style={{ ...styles.header, backgroundColor: AppColors.primary }} onLayout={onLayout}>
    <ScrollView style={{ ...styles.navBtnContainer }}>
      <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {
          menu.map((item, index) =>
            <Button style={{ ...styles.btn, width: navBtnWidth, height: navBtnWidth }} key={index} onPress={() => navPress(item, index)}>
              <Icon name={item.icon} style={{ color: homeViewPageIndex == index ? AppColors.secondary : AppColors.normal10 }} size={navIconSize} />
            </Button>)
        }
      </View>
    </ScrollView>

    <View style={{ flexGrow: 0, flexShrink: 1, paddingBottom: paddingBottom, paddingTop: paddingBottom / 2 }}>
      <View style={{ flexShrink: 0, width: '100%', flexDirection: 'row', flexWrap: 'wrap' }}>
        <TouchableOpacity activeOpacity={0.5} onPress={toggleNextPlayMode}>
          <Text style={{ ...styles.cotrolBtn, ...btnStyle }}>
            <Icon name={playModeIcon} style={{ color: AppColors.secondary10 }} size={iconSize} />
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexShrink: 0, width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly' }}>
        <TouchableOpacity activeOpacity={0.5} onPress={actions.playPrev}>
          <Text style={{ ...styles.cotrolBtn, ...btnStyle, transform: [{ rotate: '180deg' }] }}>
            <Icon name='nextMusic' style={{ color: AppColors.secondary10 }} size={iconSize} />
          </Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.5} onPress={togglePlay}>
          <Text style={{ ...styles.cotrolBtn, ...btnStyle }}>
            <Icon name={playIcon} style={{ color: AppColors.secondary10 }} size={iconSize} />
          </Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.5} onPress={actions.playNext}>
          <Text style={{ ...styles.cotrolBtn, ...btnStyle }}>
            <Icon name='nextMusic' style={{ color: AppColors.secondary10 }} size={iconSize} />
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', paddingLeft: paddingBottom }}>
        <View style={{ borderRadius: 4, marginTop: paddingBottom / 2 }} elevation={1}>
          <Image source={{ uri: targetMusic.img }} borderRadius={4} style={{
            ...styles.playInfoImg,
            backgroundColor: AppColors.primary,
            width: imgWidth,
            height: imgWidth,
          }} />
        </View>
        <View style={{ flexShrink: 1, flexGrow: 1, flexDirection: 'column', justifyContent: 'space-evenly', paddingLeft: paddingBottom, paddingRight: paddingBottom }}>
          <Text style={{ width: '100%', fontSize: 12 }} numberOfLines={1}>{targetMusic.singer}</Text>
          <Text style={{ width: '100%', fontSize: 12 }} numberOfLines={1}>{targetMusic.name}</Text>
        </View>
      </View>
    </View>
  </View>
}


const styles = StyleSheet.create({
  header: {
    width: '18%',
    minWidth: 40,
    height: '100%',
    // paddingTop: StatusBar.currentHeight,
    // borderRightWidth: 0.4,
    // borderLeftWidth: 0.4,
    // borderRightColor: '#eee',
    // Android shadow
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.23,
    // shadowRadius: 2.62,
    // elevation: 2,
    justifyContent: 'space-between',
  },
  container: {
    // width: '100%',
    flexDirection: 'column',
  },
  navBtnContainer: {
    flexGrow: 0,
    flexShrink: 1,
  },
  btn: {
    // flex: 1,
    backgroundColor: 'rgba(0,0,0,0)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cotrolBtn: {
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 2,
    // textShadowOffset: { width: 2, height: 2 },
  },
})
