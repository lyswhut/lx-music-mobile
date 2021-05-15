import React, { useCallback, memo, useRef } from 'react'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { useGetter } from '@/store'
import { BorderWidths } from '@/theme'
import Icon from '@/components/common/Icon'


export default memo(({ item, onPress }) => {
  const theme = useGetter('common', 'theme')

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
    <View style={{ ...styles.listItem, borderBottomWidth: BorderWidths.normal, borderBottomColor: theme.borderColor2 }}>
      <TouchableOpacity style={styles.listItem} onPress={ () => { onPress(item) } }>
        <View style={styles.itemInfo}>
          <View style={styles.listItemTitle}>
            <Text style={{ ...styles.listItemTitleText, color: theme.normal }}>{item.name}</Text>
          </View>
          <View style={styles.row2}><Text style={{ ...styles.listItemDesc, color: theme.normal50 }} numberOfLines={1}>{item.mtime ? new Date(item.mtime).toLocaleString() : item.desc}</Text></View>
        </View>
        {item.isDir ? <Icon name="chevron-right" style={{ color: theme.secondary20, fontSize: 18 }} /> : <Text style={{ ...styles.size, color: theme.normal40 }}>{item.sizeText}</Text>}
      </TouchableOpacity>
    </View>
  )
})

const styles = StyleSheet.create({
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
  listItemTitle: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  listItemTitleText: {
    // backgroundColor: 'rgba(0,0,0,0.2)',
    flexGrow: 0,
    flexShrink: 1,
    fontSize: 15,
  },
  listItemDesc: {
    fontSize: 11,
    paddingTop: 2,
  },
  size: {
    fontSize: 11,
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
})

