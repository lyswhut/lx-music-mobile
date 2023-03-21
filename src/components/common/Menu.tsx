import React, { useImperativeHandle, forwardRef, useMemo, useRef, useState, type Ref } from 'react'
import { View, Animated, TouchableHighlight } from 'react-native'
import { useDimensions } from '@/utils/hooks'

import Modal, { type ModalType } from './Modal'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'

const menuItemHeight = scaleSizeH(40)
const menuItemWidth = scaleSizeW(100)

export interface Position { w: number, h: number, x: number, y: number, menuWidth?: number, menuHeight?: number }
export interface MenuSize { width?: number, height?: number }
export type Menus = Readonly<Array<{ action: string, label: string, disabled?: boolean }>>

const styles = createStyle({
  mask: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0,
    backgroundColor: 'black',
  },
  menu: {
    position: 'absolute',
    // borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'lightgray',
    borderRadius: 2,
    backgroundColor: 'white',
    elevation: 3,
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
  // menuText: {
  //   // textAlign: 'center',
  //   fontSize: 14,
  // },
})

interface Props<M extends Menus = Menus> {
  menus: Readonly<M>
  onPress?: (menu: M[number]) => void
  buttonPosition: Position
  menuSize: MenuSize
  onHide: () => void
  width?: number
  height?: number
  fontSize?: number
  center?: boolean
  activeId?: M[number]['action'] | null
}

const Menu = ({
  buttonPosition,
  menuSize,
  menus,
  onPress = () => {},
  onHide,
  activeId,
  fontSize = 15,
  center = false,
}: Props) => {
  const theme = useTheme()
  const { window: windowSize } = useDimensions()
  // const fadeAnim = useRef(new Animated.Value(0)).current
  // console.log(buttonPosition)

  const menuItemStyle = useMemo(() => {
    return {
      width: menuSize.width ?? menuItemWidth,
      height: menuSize.height ?? menuItemHeight,
    }
  }, [menuSize])

  const menuStyle = useMemo(() => {
    let menuHeight = menus.length * menuItemStyle.height
    const topHeight = buttonPosition.y - 20
    const bottomHeight = windowSize.height - buttonPosition.y - buttonPosition.h - 20
    if (menuHeight > topHeight && menuHeight > bottomHeight) menuHeight = Math.max(topHeight, bottomHeight)

    const menuWidth = menuItemStyle.width
    const bottomSpace = windowSize.height - buttonPosition.y - buttonPosition.h - 20
    const rightSpace = windowSize.width - buttonPosition.x - menuWidth
    const showInBottom = bottomSpace >= menuHeight
    const showInRight = rightSpace >= menuWidth
    const frameStyle: {
      height: number
      width: number
      top: number
      left?: number
      right?: number
    } = {
      height: menuHeight,
      top: showInBottom ? buttonPosition.y + buttonPosition.h : buttonPosition.y - menuHeight,
      width: menuWidth,
    }
    if (showInRight) {
      frameStyle.left = buttonPosition.x
    } else {
      frameStyle.right = windowSize.width - buttonPosition.x - buttonPosition.w
    }
    return frameStyle
  }, [menus.length, menuItemStyle, buttonPosition, windowSize])

  const menuPress = (menu: Menus[number]) => {
    // if (menu.disabled) return
    onPress(menu)
    onHide()
  }

  // console.log('render menu')
  // console.log(activeId)
  // console.log(menuStyle)
  // console.log(menuItemStyle)
  return (
    <View style={{ ...styles.menu, ...menuStyle, backgroundColor: theme['c-content-background'] }} onStartShouldSetResponder={() => true}>
      <Animated.ScrollView keyboardShouldPersistTaps={'always'}>
        {
          menus.map((menu, index) => (
            menu.disabled
              ? (
                  <View
                    key={menu.action}
                    style={{ ...styles.menuItem, width: menuItemStyle.width, height: menuItemStyle.height, opacity: 0.4 }}
                  >
                    <Text style={{ textAlign: center ? 'center' : 'left' }} size={fontSize} numberOfLines={1}>{menu.label}</Text>
                  </View>
                )
              : menu.action == activeId
                ? (
                    <View
                      key={menu.action}
                      style={{ ...styles.menuItem, width: menuItemStyle.width, height: menuItemStyle.height }}
                    >
                      <Text style={{ textAlign: center ? 'center' : 'left' }} color={theme['c-primary-font-active']} size={fontSize} numberOfLines={1}>{menu.label}</Text>
                    </View>
                  )
                : (
                    <TouchableHighlight
                      key={menu.action}
                      style={{ ...styles.menuItem, width: menuItemStyle.width, height: menuItemStyle.height }}
                      underlayColor={theme['c-primary-background-active']}
                      onPress={() => { menuPress(menu) }}
                    >
                      <Text style={{ textAlign: center ? 'center' : 'left' }} size={fontSize} numberOfLines={1}>{menu.label}</Text>
                    </TouchableHighlight>
                  )

          ))
        }
      </Animated.ScrollView>
    </View>
  )
}

export interface MenuProps<M extends Menus = Menus> {
  menus: M
  onPress: (menu: M[number]) => void
  onHide?: () => void
  width?: number
  height?: number
  fontSize?: number
  center?: boolean
  activeId?: M[number]['action'] | null
}

export interface MenuType {
  show: (position: Position, menuSize?: MenuSize) => void
  hide: () => void
}

const Component = <M extends Menus>({ menus, activeId, onHide, onPress, fontSize, center }: MenuProps<M>, ref: Ref<MenuType>) => {
  // console.log(visible)
  const modalRef = useRef<ModalType>(null)
  const [position, setPosition] = useState<Position>({ w: 0, h: 0, x: 0, y: 0 })
  const [menuSize, setMenuSize] = useState<MenuSize>({ })
  const hide = () => {
    modalRef.current?.setVisible(false)
  }
  useImperativeHandle(ref, () => ({
    show(newPosition, menuSize) {
      setPosition(newPosition)
      if (menuSize) setMenuSize(menuSize)
      modalRef.current?.setVisible(true)
    },
    hide() {
      hide()
    },
  }))

  return (
    <Modal onHide={onHide} ref={modalRef}>
      <Menu menus={menus} activeId={activeId} buttonPosition={position} menuSize={menuSize} onPress={onPress} onHide={hide} fontSize={fontSize} center={center} />
    </Modal>
  )
}

// export default forwardRef(Component) as ForwardRefFn<MenuType>
export default forwardRef(Component) as <M extends Menus>(p: MenuProps<M> & { ref?: Ref<MenuType> }) => JSX.Element | null
