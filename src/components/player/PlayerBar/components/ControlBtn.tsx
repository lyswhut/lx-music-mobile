import { TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useIsPlay } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { createStyle } from '@/utils/tools'
import { useHorizontalMode } from '@/utils/hooks'

const BTN_SIZE = 20
const PLAY_BTN_SIZE = 28
const handlePlayPrev = () => {
  void playPrev()
}
const handlePlayNext = () => {
  void playNext()
}

const PlayPrevBtn = () => {
  const theme = useTheme()

  return (
    <TouchableOpacity style={styles.cotrolBtn} activeOpacity={0.5} onPress={handlePlayPrev}>
      <Icon name='prevMusic' color={theme['c-button-font']} size={BTN_SIZE} />
    </TouchableOpacity>
  )
}

const PlayNextBtn = () => {
  const theme = useTheme()

  return (
    <TouchableOpacity style={styles.cotrolBtn} activeOpacity={0.5} onPress={handlePlayNext}>
      <Icon name='nextMusic' color={theme['c-button-font']} size={BTN_SIZE} />
    </TouchableOpacity>
  )
}

const TogglePlayBtn = () => {
  const isPlay = useIsPlay()
  const theme = useTheme()
  const iconSize = BTN_SIZE * 0.75

  return (
    <TouchableOpacity style={styles.cotrolBtn} activeOpacity={0.5} onPress={togglePlay}>
      <View style={{ ...styles.playBtn, backgroundColor: theme['c-primary'] }}>
        {/* 右向三角的重心在其外接矩形左侧 1/6 字宽处，右移同样的量才能光学居中 */}
        <Icon name={isPlay ? 'pause' : 'play'} color={theme['c-000']} size={iconSize} style={isPlay ? undefined : { transform: [{ translateX: iconSize * 0.16 }] }} />
      </View>
    </TouchableOpacity>
  )
}

export default () => {
  const isHorizontalMode = useHorizontalMode()
  return (
    <>
      {/* <TouchableOpacity activeOpacity={0.5} onPress={toggleNextPlayMode}>
        <Text style={{ ...styles.cotrolBtn }}>
          <Icon name={playModeIcon} style={{ color: theme.secondary10 }} size={18} />
        </Text>
      </TouchableOpacity>
    */}
      {/* {btnPrev} */}
      { isHorizontalMode ? <PlayPrevBtn /> : null }
      <TogglePlayBtn />
      <PlayNextBtn />
    </>
  )
}


const styles = createStyle({
  cotrolBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 1,
  },
  playBtn: {
    width: PLAY_BTN_SIZE,
    height: PLAY_BTN_SIZE,
    borderRadius: PLAY_BTN_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
