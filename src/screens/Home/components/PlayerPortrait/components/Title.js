import React, { useCallback, memo, useMemo, useEffect } from 'react'
import { Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useGetter, useDispatch } from '@/store'
import { navigations } from '@/navigation'
import { LIST_ID_PLAY_TEMP, LIST_ID_PLAY_LATER, NAV_VIEW_NAMES } from '@/config/constant'


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

  const downloadFileName = useGetter('common', 'downloadFileName')
  const title = useMemo(() => {
    let title = '^-^'
    if (playMusicInfo && playMusicInfo.musicInfo) {
      title = downloadFileName.replace('歌手', playMusicInfo.musicInfo.singer).replace('歌名', playMusicInfo.musicInfo.name)
    }
    return title
  }, [downloadFileName, playMusicInfo])
  // console.log(playMusicInfo)
  return (
    <TouchableOpacity style={{ width: '100%' }} onLongPress={handleLongPress} onPress={handlePress} activeOpacity={0.7} >
      <Text style={{ fontSize: 14, color: theme.normal }} numberOfLines={1}>{title}</Text>
    </TouchableOpacity>
  )
}
// const Singer = () => {
//   const playMusicInfo = useGetter('player', 'playMusicInfo')
//   return (
//     <View style={{ flexGrow: 0, flexShrink: 0 }}>
//       <Text style={{ width: '100%', color: AppColors.normal }} numberOfLines={1}>
//         {playMusicInfo ? playMusicInfo.musicInfo.singer : ''}
//       </Text>
//     </View>
//   )
// }
// const MusicName = () => {
//   const playMusicInfo = useGetter('player', 'playMusicInfo')
//   return (
//     <View style={{ flexGrow: 0, flexShrink: 1 }}>
//       <Text style={{ width: '100%', color: AppColors.normal }} numberOfLines={1}>
//         {playMusicInfo ? playMusicInfo.musicInfo.name : '^-^'}
//       </Text>
//     </View>
//   )
// }

// const styles = StyleSheet.create({

// })
