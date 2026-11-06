import { TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
// import { useIsPlay } from '@/store/player/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import { useWindowSize } from '@/utils/hooks'
import { BTN_WIDTH } from './MoreBtn/Btn'
import { useMemo } from 'react'

const PrevBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const handlePlayPrev = () => {
    void playPrev()
  }
  return (
    <TouchableOpacity style={{ ...styles.cotrolBtn, width: size, height: size }} activeOpacity={0.5} onPress={handlePlayPrev}>
      <Icon name='prevMusic' color={theme['c-button-font']} rawSize={size * 0.7} />
    </TouchableOpacity>
  )
}
const NextBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const handlePlayNext = () => {
    void playNext()
  }
  return (
    <TouchableOpacity style={{ ...styles.cotrolBtn, width: size, height: size }} activeOpacity={0.5} onPress={handlePlayNext}>
      <Icon name='nextMusic' color={theme['c-button-font']} rawSize={size * 0.7} />
    </TouchableOpacity>
  )
}

const TogglePlayBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const isPlay = useIsPlay()
  // 按钮放大后三角形相对按钮更小，视觉更精致
  const iconSize = size * 0.32
  return (
    <TouchableOpacity
      style={{
        ...styles.cotrolBtn,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme['c-primary'],
      }}
      activeOpacity={0.5}
      onPress={togglePlay}
    >
      {/* 右向三角的重心在其外接矩形左侧 1/6 字宽处，右移同样的量才能光学居中 */}
      <Icon
        name={isPlay ? 'pause' : 'play'}
        color={theme['c-000']}
        rawSize={iconSize}
        style={isPlay ? undefined : { transform: [{ translateX: iconSize * 0.16 }] }}
      />
    </TouchableOpacity>
  )
}

const MAX_SIZE = BTN_WIDTH * 1.2
const MIN_SIZE = BTN_WIDTH * 0.85

export default () => {
  const winSize = useWindowSize()
  const maxHeight = Math.max(winSize.height * 0.13, MIN_SIZE)
  const containerStyle = useMemo(() => {
    return {
      ...styles.conatiner,
      maxHeight,
    }
  }, [maxHeight])
  const size = Math.min(Math.max(winSize.width * 0.22 * global.lx.fontSize * 0.4, MIN_SIZE), MAX_SIZE, maxHeight)
  // 中间的播放按钮比两侧切歌按钮更大，突出主操作
  const playSize = Math.min(size * 1.35, BTN_WIDTH * 1.5, maxHeight)

  return (
    <View style={containerStyle}>
      <PrevBtn size={size} />
      <TogglePlayBtn size={playSize}/>
      <NextBtn size={size} />
    </View>
  )
}


const styles = createStyle({
  conatiner: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: '4%',
    paddingVertical: 2,
    // backgroundColor: 'rgba(0, 0, 0, .1)',
  },
  cotrolBtn: {
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 1,
  },
})
