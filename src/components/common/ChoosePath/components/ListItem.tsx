import React, { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'

export interface PathItem {
  name: string
  path: string
  isDir: boolean
  mtime?: Date
  desc?: string
  size?: number
  sizeText?: string
}

export default memo(({ item, onPress }: {
  item: PathItem
  onPress: (item: PathItem) => void
}) => {
  const theme = useTheme()

  // const moreButtonRef = useRef()
  // const handleShowMenu = useCallback(() => {
  //   if (moreButtonRef.current && moreButtonRef.current.measure) {
  //     moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
  //       // console.log(fx, fy, width, height, px, py)
  //       showMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
  //     })
  //   }
  // }, [item, index, showMenu])

  return (
    <View style={styles.listItem}>
      <TouchableOpacity style={styles.listItem} onPress={ () => { onPress(item) } }>
        <View style={styles.itemInfo}>
          <Text style={styles.listItemTitleText}>{item.name}</Text>
          <Text style={styles.listItemDesc} size={12} color={theme['c-font-label']} numberOfLines={1}>{item.mtime ? new Date(item.mtime).toLocaleString() : item.desc}</Text>
        </View>
        {
        item.isDir
          ? <Icon name="chevron-right" color={theme['c-primary-light-100-alpha-600']} size={18} />
          : <Text style={styles.size} size={12} color={theme['c-font-label']}>{item.sizeText}</Text>
        }
      </TouchableOpacity>
    </View>
  )
})

const styles = createStyle({
  listItem: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingLeft: 10,
    paddingRight: 10,
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  itemInfo: {
    flexGrow: 1,
    flexShrink: 1,
    paddingTop: 10,
    paddingBottom: 10,
  },
  listItemTitleText: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    // backgroundColor: 'rgba(0,0,0,0.2)',
    flexGrow: 0,
    flexShrink: 1,
  },
  listItemDesc: {
    paddingTop: 2,
  },
  size: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
})

