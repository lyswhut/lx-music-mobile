import React, { useMemo, useCallback, memo } from 'react'
import { StyleSheet, View, Text, ScrollView, TouchableHighlight, TouchableWithoutFeedback } from 'react-native'
import { useDimensions } from '@/utils/hooks'

import Modal from '@/components/common/Modal'
// import { useGetter } from '@/store'

// const menuItemHeight = 42
// const menuItemWidth = 100

const styles = StyleSheet.create({
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
  panelStyle = {},
  hidePanel,
  children,
}) => {
  // const dimensions = useDimensions()
  const { window: windowSize } = useDimensions()
  // const theme = useGetter('common', 'theme')
  // const fadeAnim = useRef(new Animated.Value(0)).current
  // console.log(buttonPosition)

  // console.log(dimensions)
  const style = useMemo(() => {
    const isBottom = buttonPosition.y > windowSize.height / 2
    let top
    let height
    let justifyContent
    if (isBottom) {
      height = buttonPosition.y - windowSize.height * 0.3
      top = buttonPosition.y - height
      justifyContent = 'flex-end'
    } else {
      top = buttonPosition.y + buttonPosition.h
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
    <TouchableWithoutFeedback onPress={hidePanel}>
      <View style={{ ...styles.menu, ...style }}>
        <View onStartShouldSetResponder={() => true}>
          {children}
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}

export default memo(({ visible, hidePanel, buttonPosition, children, panelStyle }) => {
  // console.log(visible)
  return (
    <Modal visible={visible} hideModal={hidePanel} onStartShouldSetResponder={() => true}>
      <Panel buttonPosition={buttonPosition} panelStyle={panelStyle} visible={visible} hidePanel={hidePanel}>
        {children}
      </Panel>
    </Modal>
  )
})

