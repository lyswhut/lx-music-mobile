import React, { useCallback, memo, useMemo, useEffect } from 'react'
import { Text, StyleSheet } from 'react-native'
import { useGetter, useDispatch } from '@/store'


export default () => {
  const theme = useGetter('common', 'theme')
  const downloadFileName = useGetter('common', 'downloadFileName')
  const playMusicInfo = useGetter('player', 'playMusicInfo')
  let title = '^-^'
  if (playMusicInfo && playMusicInfo.musicInfo) {
    title = downloadFileName.replace('歌手', playMusicInfo.musicInfo.singer).replace('歌名', playMusicInfo.musicInfo.name)
  }
  // console.log(playMusicInfo)
  return <Text style={{ width: '100%', fontSize: 14, color: theme.normal }} numberOfLines={1}>{title}</Text>
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
