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
  const [imgUrl, setImgUrl] = useState(null)
  const setNavActiveIndex = useDispatch('common', 'setNavActiveIndex')
  const setPrevSelectListId = useDispatch('common', 'setPrevSelectListId')
  const setJumpPosition = useDispatch('list', 'setJumpPosition')
  // const { t } = useTranslation()
  const componentIds = useGetter('common', 'componentIds')
  const handlePress = useCallback(() => {
    // console.log('')
    // console.log(playMusicInfo)
    if (!playMusicInfo) return
    navigations.pushPlayDetailScreen(componentIds.home)
    // toast(t('play_detail_todo_tip'), 'long')
  }, [componentIds.home, playMusicInfo])

  const handleLongPress = useCallback(() => {
    if (!playMusicInfo || playMusicInfo.listId == LIST_ID_PLAY_TEMP || playMusicInfo.listId == LIST_ID_PLAY_LATER) return
    setNavActiveIndex(NAV_VIEW_NAMES.list)
    setPrevSelectListId(playMusicInfo.listId)
    global.requestAnimationFrame(() => {
      setJumpPosition(true)
    })
  }, [playMusicInfo, setJumpPosition, setNavActiveIndex, setPrevSelectListId])

  useEffect(() => {
    const url = playMusicInfo && playMusicInfo.musicInfo ? playMusicInfo.musicInfo.img : null
    if (imgUrl == url) return
    setImgUrl(url)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playMusicInfo])

  const component = useMemo(() => (
    <TouchableOpacity onLongPress={handleLongPress} onPress={handlePress} activeOpacity={0.7} >
      <Image source={{ uri: imgUrl }} progressiveRenderingEnabled={true} borderRadius={2} style={{
        // ...styles.playInfoImg,
        backgroundColor: theme.primary,
        width: 48,
        height: 48,
      }} />
    </TouchableOpacity>
  ), [handleLongPress, handlePress, imgUrl, theme])
  return component
}


// const styles = StyleSheet.create({
//   playInfoImg: {

//   },
// })
