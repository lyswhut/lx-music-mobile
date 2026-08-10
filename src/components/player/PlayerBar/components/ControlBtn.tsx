import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useIsPlay } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { createStyle } from '@/utils/tools'
import { useHorizontalMode } from '@/utils/hooks'

const BTN_SIZE = 24
const handlePlayPrev = () => {
  void playPrev()
}
const handlePlayNext = () => {
  void playNext()
}

const PlayPrevBtn = ({ isHorizontal }: { isHorizontal: boolean }) => {
  const theme = useTheme()
  const btnSize = isHorizontal ? 26 : 24
  const style = isHorizontal ? styles.controlBtnPad : styles.cotrolBtn

  return (
    <TouchableOpacity style={style} activeOpacity={0.5} onPress={handlePlayPrev}>
      <Icon name='prevMusic' color={theme['c-button-font']} size={btnSize} />
    </TouchableOpacity>
  )
}

const PlayNextBtn = ({ isHorizontal }: { isHorizontal: boolean }) => {
  const theme = useTheme()
  const btnSize = isHorizontal ? 26 : 24
  const style = isHorizontal ? styles.controlBtnPad : styles.cotrolBtn

  return (
    <TouchableOpacity style={style} activeOpacity={0.5} onPress={handlePlayNext}>
      <Icon name='nextMusic' color={theme['c-button-font']} size={btnSize} />
    </TouchableOpacity>
  )
}

const TogglePlayBtn = ({ isHorizontal }: { isHorizontal: boolean }) => {
  const isPlay = useIsPlay()
  const theme = useTheme()
  const btnSize = isHorizontal ? 28 : 24
  const style = isHorizontal ? styles.controlBtnPad : styles.cotrolBtn

  return (
    <TouchableOpacity style={style} activeOpacity={0.5} onPress={togglePlay}>
      <Icon name={isPlay ? 'pause' : 'play'} color={theme['c-button-font']} size={btnSize} />
    </TouchableOpacity>
  )
}

export default () => {
  const isHorizontalMode = useHorizontalMode()
  return (
    <>
      { isHorizontalMode ? <PlayPrevBtn isHorizontal={isHorizontalMode} /> : null }
      <TogglePlayBtn isHorizontal={isHorizontalMode} />
      <PlayNextBtn isHorizontal={isHorizontalMode} />
    </>
  )
}


const styles = createStyle({
  cotrolBtn: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',

    shadowOpacity: 1,
    textShadowRadius: 1,
  },
  controlBtnPad: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',

    shadowOpacity: 1,
    textShadowRadius: 1,
  },
})
