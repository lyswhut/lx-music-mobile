import { memo, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { scaleSizeW } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { Icon } from '@/components/common/Icon'

const gap = scaleSizeW(15)

export default memo(({ item, index, width, onShowMenu, onPress }: {
  item: LX.List.UserListInfo
  index: number
  width: number
  onShowMenu: (item: LX.List.UserListInfo, index: number, moreButtonRef: any) => void
  onPress: (item: LX.List.UserListInfo, index: number) => void
}) => {
  const theme = useTheme()
  const moreButtonRef = useRef<TouchableOpacity>(null)
  const itemWidth = width - gap

  const handlePress = () => {
    onPress(item, index)
  }

  const handleLongPress = () => {
    onShowMenu(item, index, moreButtonRef.current as any)
  }

  const handleShowMenu = () => {
    onShowMenu(item, index, moreButtonRef.current as any)
  }

  return (
    <View style={{ ...styles.listItem, width: itemWidth }}>
      <View style={{ ...styles.listItemImg, backgroundColor: theme['c-content-background'] }}>
        <TouchableOpacity activeOpacity={0.5} onPress={handlePress} onLongPress={handleLongPress}>
          <Image
            url={item.picUrl}
            style={{ width: itemWidth, height: itemWidth, borderRadius: 4 }}
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity activeOpacity={0.5} onPress={handlePress} onLongPress={handleLongPress}>
        <Text style={styles.listItemTitle} numberOfLines={2}>{item.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleShowMenu} ref={moreButtonRef} style={styles.moreButton}>
        <Icon name="dots-vertical" color={theme['c-350']} size={14} />
      </TouchableOpacity>
    </View>
  )
}, (prevProps, nextProps) => {
  return prevProps.item === nextProps.item &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.width === nextProps.width &&
    prevProps.onPress === nextProps.onPress
})

const styles = createStyle({
  listItem: {
    margin: 10,
  },
  listItemImg: {
    borderRadius: 4,
    marginBottom: 5,
    overflow: 'hidden',
  },
  listItemTitle: {
    fontSize: 12,
    marginBottom: 5,
  },
  moreButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    padding: 6,
    zIndex: 1,
  },
})
