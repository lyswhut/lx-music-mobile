import React, { useCallback, memo, useMemo, useEffect, useState } from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { useGetter, useDispatch } from '@/store'
import { toast } from '@/utils/tools'
import { useTranslation } from '@/plugins/i18n'
import { LIST_ID_PLAY_TEMP, LIST_ID_PLAY_LATER, NAV_VIEW_NAMES } from '@/config/constant'
import { navigations } from '@/navigation'

export default () => {
  const playMusicInfo = useGetter('player', 'playMusicInfo')
  const theme = useGetter('common', 'theme')
  const setNavActiveIndex = useDispatch('common', 'setNavActiveIndex')
  const setPrevSelectListId = useDispatch('common', 'setPrevSelectListId')
  const setJumpPosition = useDispatch('list', 'setJumpPosition')
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

  const handleLongPress = useCallback(() => {
    if (!playMusicInfo || playMusicInfo.listId == LIST_ID_PLAY_TEMP || playMusicInfo.listId == LIST_ID_PLAY_LATER) return
    setNavActiveIndex(NAV_VIEW_NAMES.list)
    setPrevSelectListId(playMusicInfo.listId)
    global.requestAnimationFrame(() => {
      setJumpPosition(true)
    })
  }, [playMusicInfo, setJumpPosition, setNavActiveIndex, setPrevSelectListId])


  const component = useMemo(() => (
    <TouchableOpacity onLongPress={handleLongPress} onPress={handlePress} activeOpacity={0.7} >
      <Image source={{ uri: musicInfo.img }} nativeID={`pic${musicInfo.songmid}`} progressiveRenderingEnabled={true} borderRadius={2} style={{
        // ...styles.playInfoImg,
        backgroundColor: theme.primary,
        width: 48,
        height: 48,
      }} />
    </TouchableOpacity>
  ), [handleLongPress, handlePress, musicInfo, theme])
  return component
}


// const styles = StyleSheet.create({
//   playInfoImg: {

//   },
// })
