import React, { useState, useCallback, useRef } from 'react'
// import { View } from 'react-native'

import Menu from './Menu'
import Button from './Button'


export default ({
  children,
  menus = [],
  onPress,
  longPress,
  width,
  height,
  center,
}) => {
  const [visible, setVisible] = useState(false)
  const [buttonPosition, setButtonPosition] = useState({})

  const hideMenu = useCallback(() => {
    setVisible(false)
  }, [setVisible])

  const buttonRef = useRef()
  const setPosition = useCallback((callback = () => {}) => {
    if (buttonRef.current && buttonRef.current.measure) {
      buttonRef.current.measure((fx, fy, width, height, px, py) => {
        // console.log(fx, fy, width, height, px, py)
        setButtonPosition({ x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
        callback()
      })
    }
  }, [])

  const showMenu = useCallback(() => {
    setPosition(() => {
      setVisible(true)
    })
  }, [setPosition, setVisible])

  return (
    <Button ref={buttonRef} onPress={showMenu}>
      {children}
      <Menu menus={menus}
        buttonPosition={buttonPosition}
        center={center}
        onPress={onPress}
        longPress={longPress}
        visible={visible}
        hideMenu={hideMenu}
        width={width}
        height={height}
      />
    </Button>
  )
}
