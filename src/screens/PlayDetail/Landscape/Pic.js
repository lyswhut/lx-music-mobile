import React, { memo, useMemo } from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { useGetter } from '@/store'
// import { useLayout } from '@/utils/hooks'
import { getWindowSise } from '@/utils/tools'

export default memo(({ componentId, animated }) => {
  const playMusicInfo = useGetter('player', 'playMusicInfo')
  const theme = useGetter('common', 'theme')

  const musicInfo = useMemo(() => {
    return (playMusicInfo && playMusicInfo.musicInfo) || {}
  }, [playMusicInfo])

  const imgWidth = getWindowSise().width * 0.5 * 0.42

  return (
    <View style={styles.container}>
      <View style={{ ...styles.content, elevation: animated ? 3 : 0 }}>
        <Image source={{ uri: musicInfo.img }} nativeID={`pic${musicInfo.songmid}Dest`} progressiveRenderingEnabled={true} borderRadius={2} style={{
          ...styles.img,
          backgroundColor: theme.primary,
          width: imgWidth,
          height: imgWidth,
        }} />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    // elevation: 3,
    backgroundColor: 'rgba(0,0,0,0)',
    borderRadius: 4,
  },
  img: {
    borderRadius: 4,
    // opacity: 0,
  },
})
