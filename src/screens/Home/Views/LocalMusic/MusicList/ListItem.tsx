import { memo, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { usePlayMusicInfo } from '@/store/player/hook'
import { LIST_IDS } from '@/config/constant'

const ITEM_HEIGHT = 54

type ListItemProps = {
  musicInfo: LX.Music.MusicInfoLocal
  listWidth: number
  onPlay: (musicInfo: LX.Music.MusicInfoLocal) => void
  onShowMenu: (musicInfo: LX.Music.MusicInfoLocal) => void
  isSelected?: boolean
  isMultiSelectMode?: boolean
  onSelect?: (musicInfo: LX.Music.MusicInfoLocal) => void
  onLongPress?: (musicInfo: LX.Music.MusicInfoLocal) => void
}

const ListItem = memo(
  ({ musicInfo, listWidth, onPlay, onShowMenu, isSelected, isMultiSelectMode, onSelect, onLongPress }: ListItemProps) => {
    const theme = useTheme()
    const playMusicInfo = usePlayMusicInfo()
    const active = playMusicInfo.listId === LIST_IDS.TEMP && playMusicInfo.musicInfo?.id === musicInfo.id

    const handlePress = useCallback(() => {
      if (isMultiSelectMode) {
        onSelect?.(musicInfo)
      } else {
        onPlay(musicInfo)
      }
    }, [isMultiSelectMode, onSelect, musicInfo, onPlay])

    const handleShowMenu = useCallback(() => {
      onShowMenu(musicInfo)
    }, [onShowMenu, musicInfo])

    const handleLongPress = useCallback(() => {
      onLongPress?.(musicInfo)
    }, [onLongPress, musicInfo])

    return (
      <TouchableOpacity
        style={{
          ...styles.row,
          height: ITEM_HEIGHT,
          width: listWidth,
          backgroundColor: isSelected ? theme['c-primary-background-hover'] : 'transparent',
        }}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.5}
      >
        {/* 左侧：多选模式显示复选框，播放中显示图标 */}
        <View style={styles.sn}>
          {isMultiSelectMode ? (
            <Icon
              name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={isSelected ? theme['c-primary'] : theme['c-font-label']}
            />
          ) : active ? (
            <Icon name="play-outline" size={13} color={theme['c-primary-font']} />
          ) : (
            <Text size={13} color={theme['c-300']}>♪</Text>
          )}
        </View>

        {/* 中间：歌曲信息 */}
        <View style={styles.info}>
          <Text numberOfLines={1} size={14} color={active ? theme['c-primary-font'] : theme['c-font']}>
            {musicInfo.name}
          </Text>
          {musicInfo.singer ? (
            <Text numberOfLines={1} size={12} color={active ? theme['c-primary-alpha-200'] : theme['c-font-label']}>
              {musicInfo.singer}
            </Text>
          ) : null}
        </View>

        {/* 右侧：三个点菜单 */}
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={handleShowMenu}
          activeOpacity={0.5}
        >
          <Icon name="dots-vertical" size={20} color={theme['c-font-label']} />
        </TouchableOpacity>
      </TouchableOpacity>
    )
  },
)

export default ListItem

const styles = createStyle({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
  },
  sn: {
    width: 38,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  menuBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
