import React, { useCallback, memo, useMemo, useEffect } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import Icon from '@/components/common/Icon'
import { useGetter, useDispatch } from '@/store'
import { STATUS } from '@/store/modules/player'


export default ({ playNextModes }) => {
  const playStatus = useGetter('player', 'status')
  const playNext = useDispatch('player', 'playNext')
  const playPrev = useDispatch('player', 'playPrev')
  // const playMusicInfo = useGetter('player', 'playMusicInfo')
  const pauseMusic = useDispatch('player', 'pauseMusic')
  const playMusic = useDispatch('player', 'playMusic')
  const theme = useGetter('common', 'theme')

  // const togglePlayMethod = useGetter('common', 'togglePlayMethod')
  // const setPlayNextMode = useDispatch('common', 'setPlayNextMode')
  // const toggleNextPlayMode = useCallback(() => {
  //   let index = playNextModes.indexOf(togglePlayMethod)
  //   if (++index >= playNextModes.length) index = -1
  //   setPlayNextMode(playNextModes[index] || '')
  // }, [setPlayNextMode, togglePlayMethod, playNextModes])

  const btnPrev = useMemo(() => (
    <TouchableOpacity style={{ ...styles.cotrolBtn }} activeOpacity={0.5} onPress={playPrev}>
      <Icon name='prevMusic' style={{ color: theme.secondary10 }} size={24} />
    </TouchableOpacity>
  ), [playPrev, theme])

  const togglePlay = useCallback(playStatus => {
    switch (playStatus) {
      case STATUS.playing:
        pauseMusic()
        break
      case STATUS.pause:
      case STATUS.stop:
      case STATUS.none:
        playMusic()
        break
      // default:
      //   playMusic(playMusicInfo)
        // break
    }
  }, [])
  const btnPlay = useMemo(() => (
    <TouchableOpacity style={{ ...styles.cotrolBtn }} activeOpacity={0.5} onPress={() => togglePlay(playStatus)}>
      <Icon name={playStatus == STATUS.playing ? 'pause' : 'play'} style={{ color: theme.secondary10 }} size={24} />
    </TouchableOpacity>
  ), [playStatus, theme, togglePlay])
  const btnNext = useMemo(() => (
    <TouchableOpacity style={{ ...styles.cotrolBtn }} activeOpacity={0.5} onPress={playNext}>
      <Icon name='nextMusic' style={{ color: theme.secondary10 }} size={24} />
    </TouchableOpacity>
  ), [playNext, theme])

  return (
    <View style={styles.container}>
      {/* <TouchableOpacity activeOpacity={0.5} onPress={toggleNextPlayMode}>
        <Text style={{ ...styles.cotrolBtn }}>
          <Icon name={playModeIcon} style={{ color: theme.secondary10 }} size={18} />
        </Text>
      </TouchableOpacity>
    */}
      {btnPrev}
      {btnPlay}
      {btnNext}
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    flexDirection: 'row',
    paddingLeft: 15,
    paddingRight: 15,
  },
  cotrolBtn: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 1,
  },
})
