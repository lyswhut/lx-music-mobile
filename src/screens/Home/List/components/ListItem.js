import React, { useMemo, useCallback, memo, useRef, useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { LIST_ITEM_HEIGHT } from '@/config/constant'
import { BorderWidths } from '@/theme'
import { useAssertApiSupport } from '@/utils/hooks'
import { useGetter, useDispatch } from '@/store'
import Button from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'

export default memo(({ item, index, activeIndex, onPress, showMenu, handleLongPress, selectedList }) => {
  const theme = useGetter('common', 'theme')

  const isSelected = selectedList.indexOf(item) != -1
  // console.log(item.name, selectedList, selectedList.includes(item))
  const isSupported = useAssertApiSupport(item.source)
  const moreButtonRef = useRef()
  const handleShowMenu = useCallback(() => {
    if (moreButtonRef.current && moreButtonRef.current.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        // console.log(fx, fy, width, height, px, py)
        showMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }, [item, index, showMenu])

  return (
    <View style={{ ...styles.listItem, backgroundColor: isSelected ? theme.secondary45 : theme.primary, borderBottomColor: theme.secondary45, opacity: isSupported ? 1 : 0.5 }}>
      <TouchableOpacity style={styles.listItemLeft} onPress={() => { onPress(item, index) }} onLongPress={() => { handleLongPress(item, index) }}>
        <Text style={{ ...styles.sn, color: theme.normal50 }}>{index + 1}</Text>
        <View style={styles.itemInfo}>
          <View style={styles.listItemTitle}>
            <Text style={{ ...styles.listItemTitleText, color: activeIndex == index ? theme.secondary : theme.normal }} numberOfLines={1}>{item.name}</Text>
            <Text style={{ ...styles.listItemBadge, color: theme.secondary20 }}>{item.source}</Text>
          </View>
          <View style={styles.row2}>
            <Text style={{ ...styles.listItemSingle, color: activeIndex == index ? theme.secondary20 : theme.normal40 }} numberOfLines={1}>{item.singer}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.listItemRight}>
        <TouchableOpacity onPress={handleShowMenu} ref={moreButtonRef} style={styles.moreButton}>
          <Icon name="dots-vertical" style={{ color: theme.normal35 }} size={16} />
        </TouchableOpacity>
      </View>
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.activeIndex != nextProps.index &&
    nextProps.activeIndex != nextProps.index &&
    nextProps.selectedList.includes(nextProps.item) == prevProps.selectedList.includes(nextProps.item)
  )
})


const styles = StyleSheet.create({
  listItem: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    // paddingLeft: 10,
    paddingRight: 10,
    height: LIST_ITEM_HEIGHT,
    borderBottomWidth: BorderWidths.normal,
  },
  listItemLeft: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sn: {
    width: 32,
    fontSize: 11,
    textAlign: 'center',
    // backgroundColor: 'rgba(0,0,0,0.2)',
    paddingLeft: 3,
    paddingRight: 3,
  },
  itemInfo: {
    flexGrow: 0,
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
    fontSize: 14,
  },
  listItemSingle: {
    fontSize: 12,
    paddingTop: 2,
  },
  listItemBadge: {
    fontSize: 10,
    paddingLeft: 5,
    paddingTop: 2,
    alignSelf: 'flex-start',
  },
  listItemRight: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    justifyContent: 'center',
  },

  moreButton: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
})
