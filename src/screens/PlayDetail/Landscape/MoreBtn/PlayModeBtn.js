import React, { useCallback, memo, useMemo, useEffect } from 'react'
import { Text, StyleSheet, TouchableOpacity } from 'react-native'
import Icon from '@/components/common/Icon'
import { useGetter, useDispatch } from '@/store'
import { toast } from '@/utils/tools'
import { useTranslation } from '@/plugins/i18n'
const playNextModes = [
  'listLoop',
  'random',
  'list',
  'singleLoop',
]

export default memo(({ width }) => {
  const togglePlayMethod = useGetter('common', 'togglePlayMethod')
  const theme = useGetter('common', 'theme')
  const setPlayNextMode = useDispatch('common', 'setPlayNextMode')
  const { t } = useTranslation()

  const toggleNextPlayMode = () => {
    let index = playNextModes.indexOf(togglePlayMethod)
    if (++index >= playNextModes.length) index = -1
    const mode = playNextModes[index]
    setPlayNextMode(mode || '')
    let modeName
    switch (mode) {
      case 'listLoop':
        modeName = 'play_list_loop'
        break
      case 'random':
        modeName = 'play_list_random'
        break
      case 'list':
        modeName = 'play_list_order'
        break
      case 'singleLoop':
        modeName = 'play_single_loop'
        break
      default:
        modeName = 'play_single'
        break
    }
    toast(t(modeName))
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
      <Icon name={playModeIcon} style={{ color: theme.normal30 }} size={width} />
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  cotrolBtn: {
    marginRight: '1%',
    width: '25%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 1,
  },
})
