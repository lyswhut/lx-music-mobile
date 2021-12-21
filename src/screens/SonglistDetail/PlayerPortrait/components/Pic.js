import React, { useCallback, memo, useMemo, useEffect, useState } from 'react'
import { Image, TouchableOpacity } from 'react-native'
import { useGetter, useDispatch } from '@/store'
import { navigations } from '@/navigation'

export default () => {
  const playMusicInfo = useGetter('player', 'playMusicInfo')
  const theme = useGetter('common', 'theme')
  // const { t } = useTranslation()
  const componentIds = useGetter('common', 'componentIds')
  const musicInfo = useMemo(() => {
    return (playMusicInfo && playMusicInfo.musicInfo) || {}
  }, [playMusicInfo])
  const handlePress = useCallback(() => {
    // console.log('')
    // console.log(playMusicInfo)
    if (!playMusicInfo) return
    navigations.pushPlayDetailScreen(componentIds.home, musicInfo.songmid)
    // toast(t('play_detail_todo_tip'), 'long')
  }, [componentIds.home, musicInfo, playMusicInfo])

  // const handleLongPress = useCallback(() => {
  //   if (!playMusicInfo || playMusicInfo.listId == LIST_ID_PLAY_TEMP || playMusicInfo.listId == LIST_ID_PLAY_LATER) return
  //   setNavActiveIndex(NAV_VIEW_NAMES.list)
  //   setPrevSelectListId(playMusicInfo.listId)
  //   global.requestAnimationFrame(() => {
  //     setJumpPosition(true)
  //   })
  // }, [playMusicInfo, setJumpPosition, setNavActiveIndex, setPrevSelectListId])

  const component = useMemo(() => (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} >
      <Image source={{ uri: musicInfo.img }} nativeID={`pic${musicInfo.songmid}`} progressiveRenderingEnabled={true} borderRadius={2} style={{
        // ...styles.playInfoImg,
        backgroundColor: theme.primary,
        width: 48,
        height: 48,
      }} />
    </TouchableOpacity>
  ), [handlePress, musicInfo, theme])
  return component
}


// const styles = StyleSheet.create({
//   playInfoImg: {

//   },
// })
