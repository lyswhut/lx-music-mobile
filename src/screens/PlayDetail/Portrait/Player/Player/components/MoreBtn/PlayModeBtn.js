import React, { useCallback, memo, useMemo, useEffect } from 'react'
import { Text, StyleSheet, TouchableOpacity } from 'react-native'
import Icon from '@/components/common/Icon'
import { useGetter, useDispatch } from '@/store'

const playNextModes = [
  'listLoop',
  'random',
  'list',
  'singleLoop',
]

export default memo(() => {
  const togglePlayMethod = useGetter('common', 'togglePlayMethod')
  const theme = useGetter('common', 'theme')
  const setPlayNextMode = useDispatch('common', 'setPlayNextMode')

  const toggleNextPlayMode = () => {
    let index = playNextModes.indexOf(togglePlayMethod)
    if (++index >= playNextModes.length) index = -1
    setPlayNextMode(playNextModes[index] || '')
  }

  const playModeIcon = useMemo(() => {
    let playModeIcon = null
    switch (togglePlayMethod) {
      case 'listLoop':
        playModeIcon = 'list-loop'
        break
      case 'random':
        playModeIcon = 'list-random'
        break
      case 'list':
        playModeIcon = 'list-order'
        break
      case 'singleLoop':
        playModeIcon = 'single-loop'
        break
      default:
        playModeIcon = 'single'
        break
    }
    return playModeIcon
  }, [togglePlayMethod])

  return (
    <TouchableOpacity style={{ ...styles.cotrolBtn }} activeOpacity={0.5} onPress={toggleNextPlayMode}>
      <Icon name={playModeIcon} style={{ color: theme.secondary10 }} size={24} />
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  cotrolBtn: {
    marginLeft: 5,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 1,
  },
})
