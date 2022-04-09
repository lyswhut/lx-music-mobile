import React, { useCallback, memo, useMemo, useEffect } from 'react'
import { Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useGetter, useDispatch } from '@/store'
import { toast } from '@/utils/tools'
import { useTranslation } from '@/plugins/i18n'
import { MUSIC_TOGGLE_MODE_LIST, MUSIC_TOGGLE_MODE } from '@/config/constant'

export default memo(() => {
  const togglePlayMethod = useGetter('common', 'togglePlayMethod')
  const theme = useGetter('common', 'theme')
  const setPlayNextMode = useDispatch('common', 'setPlayNextMode')
  const { t } = useTranslation()

  const toggleNextPlayMode = () => {
    let index = MUSIC_TOGGLE_MODE_LIST.indexOf(togglePlayMethod)
    if (++index >= MUSIC_TOGGLE_MODE_LIST.length) index = 0
    const mode = MUSIC_TOGGLE_MODE_LIST[index]
    setPlayNextMode(mode)
    let modeName
    switch (mode) {
      case MUSIC_TOGGLE_MODE.listLoop:
        modeName = 'play_list_loop'
        break
      case MUSIC_TOGGLE_MODE.random:
        modeName = 'play_list_random'
        break
      case MUSIC_TOGGLE_MODE.list:
        modeName = 'play_list_order'
        break
      case MUSIC_TOGGLE_MODE.singleLoop:
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
      case MUSIC_TOGGLE_MODE.listLoop:
        playModeIcon = 'list-loop'
        break
      case MUSIC_TOGGLE_MODE.random:
        playModeIcon = 'list-random'
        break
      case MUSIC_TOGGLE_MODE.list:
        playModeIcon = 'list-order'
        break
      case MUSIC_TOGGLE_MODE.singleLoop:
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
      <Icon name={playModeIcon} style={{ color: theme.normal30 }} size={24} />
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
