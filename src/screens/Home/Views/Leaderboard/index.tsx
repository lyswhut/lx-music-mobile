import React, { useEffect, useRef } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'

import LeftBar, { type LeftBarType, type LeftBarProps } from './LeftBar'
import MusicList, { type MusicListType } from './MusicList'
import { getLeaderboardSetting, saveLeaderboardSetting } from '@/utils/data'
// import { BorderWidths } from '@/theme'
// import { useTheme } from '@/store/theme/hook'


export default () => {
  const leftBarRef = useRef<LeftBarType>(null)
  const musicListRef = useRef<MusicListType>(null)
  const isUnmountedRef = useRef(false)
  // const theme = useTheme()

  const handleChangeBound: LeftBarProps['onChangeList'] = (source, id) => {
    musicListRef.current?.loadList(source, id)
    void saveLeaderboardSetting({
      source,
      boardId: id,
    })
  }

  useEffect(() => {
    isUnmountedRef.current = false
    void getLeaderboardSetting().then(({ source, boardId }) => {
      leftBarRef.current?.setBound(source, boardId)
      musicListRef.current?.loadList(source, boardId)
    })

    return () => {
      isUnmountedRef.current = true
    }
  }, [])


  return (
    <View style={styles.container}>
      <LeftBar
        ref={leftBarRef}
        onChangeList={handleChangeBound}
      />
      <MusicList
        ref={musicListRef}
      />
    </View>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    // borderTopWidth: BorderWidths.normal,
  },
  content: {
    flex: 1,
  },
})
