import { memo, useCallback } from 'react'
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

import { NEW_UI_PLAY_CIRCLE_NO_SONG_TOAST } from '@/newui/const'
import { useNowPlaying, useWideLayout } from '@/newui/hooks'
import { useProgress } from '@/store/player/hook'
import { GLASS, MINIBAR, useTheme } from '@/newui/theme'
import { showNewUiToast } from '@/newui/utils'

import { BlurredContainer } from '../Glass'
import { Icon } from '../Icon'
import { MinibarSnapped } from '../Minibar'

export interface PlayCircleProps {
  /** 有曲目时打开「正在播放」；空态由本组件自己拦截，只弹 toast */
  onPress: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * 底部工具栏常驻播放圆圈。
 * 有曲目时直接复用磁吸圆点的 CD 碟面（自转 / 进度环 / 暂停三角 / 减少动态效果都在那一边），
 * 点一下进播放页；没有曲目时留一枚同尺寸占位圆，点了只提示，避免开一个空播放页。
 * 自己订阅播放态与进度，父级只需给一个稳定回调，不会让 memo 的 TabBar 反复重渲染。
 */
export const PlayCircle = memo(({ onPress, style }: PlayCircleProps) => {
  const theme = useTheme()
  const nowPlaying = useNowPlaying()
  const { progress } = useProgress()
  const { wide } = useWideLayout()
  const size = wide ? MINIBAR.snappedSizeWide : MINIBAR.snappedSize

  const handlePress = useCallback(() => {
    if (!nowPlaying.hasSong) {
      showNewUiToast(NEW_UI_PLAY_CIRCLE_NO_SONG_TOAST)
      return
    }
    onPress()
  }, [nowPlaying.hasSong, onPress])

  if (nowPlaying.hasSong) {
    return (
      <MinibarSnapped
        artSeed={`album:${nowPlaying.album || nowPlaying.title}`}
        artUri={nowPlaying.picUrl ?? undefined}
        playing={nowPlaying.playing}
        ratio={progress}
        size={size}
        onPress={handlePress}
        accessibilityLabel="正在播放"
        style={style}
      />
    )
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="正在播放"
      onPress={handlePress}
      style={[styles.root, {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderColor: theme.colors.miniDotLine,
      }, style]}
    >
      <BlurredContainer spec={GLASS.miniSnapped} />
      <Icon name="play" size={18} color={theme.colors.text3} />
    </Pressable>
  )
})

PlayCircle.displayName = 'NewUIPlayCircle'

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
