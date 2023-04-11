import React, { useMemo, useRef, useImperativeHandle, forwardRef, useState } from 'react'
import { View, TouchableWithoutFeedback } from 'react-native'
import { useDimensions } from '@/utils/hooks'

import Modal, { type ModalType } from '@/components/common/Modal'
import { createStyle } from '@/utils/tools'
// import { useGetter } from '@/store'

// const menuItemHeight = 42
// const menuItemWidth = 100
interface Position { w: number, h: number, x: number, y: number }

const styles = createStyle({
  menu: {
    position: 'absolute',
    // borderWidth: StyleSheet.hairlineWidth,
    // borderColor: 'lightgray',
    // borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0)',
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

const Panel = ({
  buttonPosition,
  // panelStyle = {},
  onHide,
  children,
}: {
  buttonPosition: Position
  onHide: () => void
  children: React.ReactNode | React.ReactNode[]
}) => {
  // const dimensions = useDimensions()
  const { window: windowSize } = useDimensions()
  // const theme = useGetter('common', 'theme')
  // const fadeAnim = useRef(new Animated.Value(0)).current
  // console.log(buttonPosition)

  // console.log(dimensions)
  const style = useMemo(() => {
    const isBottom = buttonPosition.y > windowSize.height / 2
    let top: number
    let height: number
    let justifyContent: 'flex-end' | 'flex-start'
    if (isBottom) {
      const buttonPositionY = Math.ceil(buttonPosition.y)
      height = buttonPositionY - windowSize.height * 0.3
      top = buttonPositionY - height
      justifyContent = 'flex-end'
    } else {
      top = Math.floor(buttonPosition.y) + Math.floor(buttonPosition.h)
      height = windowSize.height * 0.7 - top
      justifyContent = 'flex-start'
    }
    const frameStyle = {
      flex: 1,
      height,
      top,
      justifyContent,
      width: windowSize.width,
    }
    return frameStyle
  }, [windowSize, buttonPosition])

  return (
    <TouchableWithoutFeedback onPress={onHide}>
      <View style={{ ...styles.menu, ...style }}>
        <View onStartShouldSetResponder={() => true}>
          {children}
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}
export interface PanelProps {
  onHide?: () => void
  keyHide?: boolean
  bgHide?: boolean
  closeBtn?: boolean
  title?: string
  children: React.ReactNode | React.ReactNode[]
  // style:
}

export interface PanelType {
  show: (position: Position) => void
  hide: () => void
}

export default forwardRef<PanelType, PanelProps>(({ onHide, keyHide, bgHide, children }, ref) => {
  const modalRef = useRef<ModalType>(null)
  const [position, setPosition] = useState<Position>({ w: 0, h: 0, x: 0, y: 0 })

  useImperativeHandle(ref, () => ({
    show(newPosition) {
      setPosition(newPosition)
      modalRef.current?.setVisible(true)
    },
    hide() {
      modalRef.current?.setVisible(false)
    },
  }))

  // console.log(visible)
  return (
    <Modal ref={modalRef} onHide={onHide} onStartShouldSetResponder={() => true} keyHide={keyHide} bgHide={bgHide}>
      <Panel buttonPosition={position} onHide={() => modalRef.current?.setVisible(false)}>
        {children}
      </Panel>
    </Modal>
  )
})

