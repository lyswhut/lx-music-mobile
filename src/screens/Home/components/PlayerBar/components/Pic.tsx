import React, { memo } from 'react'
import { View, Image, TouchableOpacity } from 'react-native'
import { navigations } from '@/navigation'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { createStyle } from '@/utils/tools'
import { BorderRadius } from '@/theme'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import Text from '@/components/common/Text'
import { LIST_IDS, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'

const PIC_HEIGHT = scaleSizeH(46)

const styles = createStyle({
  // content: {
  // marginBottom: 3,
  // },/
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

const EmptyPic = memo(() => {
  const theme = useTheme()
  return (
    <View nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={{ ...styles.emptyPic, width: PIC_HEIGHT, height: PIC_HEIGHT, backgroundColor: theme['c-primary-light-900-alpha-200'] }}>
      <Text size={20} color={theme['c-primary-light-400-alpha-200']}>L</Text>
      <Text size={20} color={theme['c-primary-light-400-alpha-200']} style={styles.text}>X</Text>
    </View>
  )
})

export default () => {
  const musicInfo = usePlayerMusicInfo()
  const handlePress = () => {
    // console.log('')
    // console.log(playMusicInfo)
    if (!musicInfo.id) return
    navigations.pushPlayDetailScreen(commonState.componentIds.home as string)

    // toast(global.i18n.t('play_detail_todo_tip'), 'long')
  }

  const handleLongPress = () => {
    const listId = playerState.playMusicInfo.listId
    if (!listId || listId == LIST_IDS.DOWNLOAD) return
    global.app_event.jumpListPosition()
  }

  // console.log('render pic')

  return (
    <TouchableOpacity onLongPress={handleLongPress} onPress={handlePress} activeOpacity={0.7} >
      {
        musicInfo.pic
          ? (
              <Image source={{ uri: musicInfo.pic }} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} progressiveRenderingEnabled={true} borderRadius={2} style={{
                // ...styles.playInfoImg,
                // backgroundColor: theme.primary,
                width: PIC_HEIGHT,
                height: PIC_HEIGHT,
              }} />
            )
          : <EmptyPic />
      }
    </TouchableOpacity>
  )
}


// const styles = StyleSheet.create({
//   playInfoImg: {

//   },
// })
