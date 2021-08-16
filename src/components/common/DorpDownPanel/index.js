import React, { useState, useCallback, useRef } from 'react'
// import { View } from 'react-native'

import Panel from './Panel'
import Button from '@/components/common/Button'


export default ({
  children,
  panelStyle,
  PanelContent,
  visible,
  setVisible,
}) => {
  const [buttonPosition, setButtonPosition] = useState({})

  const hidePanel = useCallback(() => {
    setVisible(false)
  }, [setVisible])

  const buttonRef = useRef()
  const setPosition = useCallback((callback = () => {}) => {
    if (buttonRef.current && buttonRef.current.measure) {
      buttonRef.current.measure((fx, fy, width, height, px, py) => {
        // console.log(fx, fy, width, height, px, py)
        setButtonPosition({ x: px, y: py, w: width, h: height })
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
      <Panel
        buttonPosition={buttonPosition}
        visible={visible}
        panelStyle={panelStyle}
        hidePanel={hidePanel}
      >
        {PanelContent}
      </Panel>
    </Button>
  )
}
