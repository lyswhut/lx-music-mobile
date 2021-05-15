import React, { useCallback, memo, useRef, useMemo } from 'react'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { useGetter } from '@/store'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import { BorderWidths } from '@/theme'
import { useTranslation } from '@/plugins/i18n'
import Icon from '@/components/common/Icon'

const useQualityTag = musicInfo => {
  const { t } = useTranslation()
  let info = {}
  if (musicInfo._types.ape || musicInfo._types.flac) {
    info.type = 'secondary'
    info.text = t('quality_lossless')
  } else if (musicInfo._types['320k']) {
    info.type = 'tertiary'
    info.text = t('quality_high_quality')
  } else info = null

  return info
}

export default memo(({ item, index, onPress, showMenu, handleLongPress, selectedList }) => {
  const theme = useGetter('common', 'theme')

  const isSelected = selectedList.indexOf(item) != -1

  const moreButtonRef = useRef()
  const handleShowMenu = useCallback(() => {
    if (moreButtonRef.current && moreButtonRef.current.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        // console.log(fx, fy, width, height, px, py)
        showMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }, [item, index, showMenu])
  const tagInfo = useQualityTag(item)

  return (
    <View style={{ ...styles.listItem, backgroundColor: isSelected ? theme.secondary45 : theme.primary, borderBottomColor: theme.secondary45 }}>
      <TouchableOpacity style={styles.listItemLeft} onPress={ () => { onPress(item, index) }} onLongPress={() => { handleLongPress(item, index) }}>
        <Text style={{ ...styles.sn, color: theme.normal50 }}>{index + 1}</Text>
        <View style={styles.itemInfo}>
          <View style={styles.listItemTitle}>
            <Text style={{ ...styles.listItemTitleText, color: theme.normal }}>{item.name}</Text>
            { tagInfo ? <Badge type={tagInfo.type}>{tagInfo.text}</Badge> : null }
          </View>
          <View style={styles.row2}><Text style={{ ...styles.listItemSingle, color: theme.normal40 }}>{item.singer}</Text></View>
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
    nextProps.selectedList.includes(nextProps.item) == prevProps.selectedList.includes(nextProps.item)
  )
})

const styles = StyleSheet.create({
  listItem: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    borderBottomWidth: BorderWidths.normal,
    // paddingLeft: 10,
    paddingRight: 10,
  },
  listItemLeft: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.1)',
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
    paddingBottom: 2,
  },
  listItemRight: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    justifyContent: 'center',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  moreButton: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
})

