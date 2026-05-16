import { memo, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import Icon from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

const ITEM_HEIGHT = 54

type ListItemProps = {
  musicInfo: LX.Music.MusicInfoLocal
  index: number
  listWidth: number
  onPlay: (index: number) => void
  onShowMenu: (musicInfo: LX.Music.MusicInfoLocal, index: number) => void
}

const ListItem = memo(
  ({ musicInfo, index, listWidth, onPlay, onShowMenu }: ListItemProps) => {
    const theme = useTheme()

    const handlePlay = useCallback(() => {
      onPlay(index)
    }, [onPlay, index])

    const handleShowMenu = useCallback(() => {
      onShowMenu(musicInfo, index)
    }, [onShowMenu, musicInfo, index])

    return (
      <TouchableOpacity
        style={{
          ...styles.row,
          height: ITEM_HEIGHT,
          width: listWidth,
        }}
        onPress={handlePlay}
        activeOpacity={0.5}
      >
        {/* 左侧：封面占位 */}
        <View style={styles.cover}>
          <Icon name="music" size={20} color={theme['c-font-label']} />
        </View>

        {/* 中间：歌曲信息 */}
        <View style={styles.info}>
          <Text numberOfLines={1} size={14} color={theme['c-font']}>
            {musicInfo.songname}
          </Text>
          {musicInfo.singer ? (
            <Text numberOfLines={1} size={12} color={theme['c-font-label']}>
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
  cover: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: 'rgba(128,128,128,0.2)',
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
