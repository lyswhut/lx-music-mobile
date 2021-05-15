import React, { useMemo, useCallback, memo } from 'react'
import { StyleSheet, View, Text, Animated, useWindowDimensions, TouchableHighlight } from 'react-native'
import { useDimensions } from '@/utils/hooks'

import Modal from './Modal'
import { useGetter } from '@/store'

// const menuItemHeight = 42
// const menuItemWidth = 100

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'lightgray',
    borderRadius: 2,
    backgroundColor: 'white',
    elevation: 1,
  },
  menuItem: {
    paddingLeft: 10,
    paddingRight: 10,
    // height: menuItemHeight,
    // width: menuItemWidth,
    // alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#ccc',
  },
  menuText: {
    // textAlign: 'center',
  },
})

const Menu = ({
  buttonPosition,
  menus,
  onPress = () => {},
  longPress = () => {},
  center = false,
  hideMenu,
  width = 100,
  height = 42,
}) => {
  const dimensions = useDimensions()
  const theme = useGetter('common', 'theme')
  // const fadeAnim = useRef(new Animated.Value(0)).current
  // console.log(buttonPosition)
  const screenSize = useMemo(() => {
    const screenSize = {}
    if (dimensions.window.height > dimensions.window.width) {
      screenSize.height = dimensions.screen.height
      screenSize.width = dimensions.screen.width
    } else {
      screenSize.height = dimensions.screen.width
      screenSize.width = dimensions.screen.height
    }
    return screenSize
  }, [dimensions])

  const menuStyle = useMemo(() => {
    let menuHeight = menus.length * height + 1
    const topHeight = buttonPosition.y - 20
    const bottomHeight = screenSize.height - buttonPosition.y - buttonPosition.h - 20
    if (menuHeight > topHeight && menuHeight > bottomHeight) menuHeight = Math.max(topHeight, bottomHeight)

    const menuWidth = width
    const bottomSpace = screenSize.height - buttonPosition.y - buttonPosition.h - 20
    const rightSpace = screenSize.width - buttonPosition.x - menuWidth - 20
    const showInBottom = bottomSpace >= menuHeight
    const showInRight = rightSpace >= menuWidth
    const frameStyle = {
      height: menuHeight,
      top: showInBottom ? buttonPosition.y + buttonPosition.h : buttonPosition.y - menuHeight,
    }
    if (showInRight) {
      frameStyle.left = buttonPosition.x
    } else {
      frameStyle.right = screenSize.width - buttonPosition.x - buttonPosition.w
    }
    return frameStyle
  }, [screenSize, buttonPosition, menus, width, height])

  const menuPress = useCallback((menu, index) => {
    if (menu.disabled) return
    onPress(menu, index)
    hideMenu()
  }, [onPress, hideMenu])

  const menuLongPress = useCallback((menu, index) => {
    if (menu.disabled) return
    longPress(menu, index)
    // hideMenu()
  }, [longPress])

  // console.log(menuStyle)
  return (
    <View style={{ ...styles.menu, ...menuStyle, backgroundColor: theme.primary }} onStartShouldSetResponder={() => true}>
      <Animated.ScrollView keyboardShouldPersistTaps={'always'}>
        {
          menus.map((menu, index) => (
            <TouchableHighlight
              key={menu.action}
              style={{ ...styles.menuItem, width: width, height: height }}
              underlayColor={theme.secondary40}
              onPress={() => { menuPress(menu, index) }}
              onLongPress={() => { menuLongPress(menu, index) }}
            >
              <Text style={{ ...styles.menuText, textAlign: center ? 'center' : 'left', color: theme.normal }} numberOfLines={1}>{menu.label}</Text>
            </TouchableHighlight>
          ))
        }
      </Animated.ScrollView>
    </View>
  )
}

export default memo(({ visible, hideMenu, buttonPosition, menus, longPress, onPress, width, height }) => {
  // console.log(visible)
  return (
    <Modal visible={visible} hideModal={hideMenu} onStartShouldSetResponder={() => true}>
      <View style={{ flex: 1 }}>
        <Menu menus={menus} buttonPosition={buttonPosition} longPress={longPress} onPress={onPress} visible={visible} hideMenu={hideMenu} width={width} height={height} />
      </View>
    </Modal>
  )
})

