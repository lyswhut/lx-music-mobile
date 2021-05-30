import React, { memo, useMemo, useState, useEffect } from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { useGetter, useDispatch } from '@/store'
import { useLayout } from '@/utils/hooks'

export default memo(() => {
  const playMusicInfo = useGetter('player', 'playMusicInfo')
  const theme = useGetter('common', 'theme')
  const { onLayout, ...layout } = useLayout()

  const musicInfo = useMemo(() => {
    return (playMusicInfo && playMusicInfo.musicInfo) || {}
  }, [playMusicInfo])

  const imgWidth = Math.max(layout.width * 0.8, 100)

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={{ ...styles.content }}>
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
    elevation: 3,
    backgroundColor: 'rgba(0,0,0,0)',
    borderRadius: 4,
  },
  img: {
    borderRadius: 4,
    // opacity: 0,
  },
})
