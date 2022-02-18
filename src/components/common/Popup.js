import React, { useMemo } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native'

import Modal from './Modal'
import { Icon } from '@/components/common/Icon'
import { useGetter } from '@/store'
import { useKeyboard } from '@/utils/hooks'

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    // justifyContent: 'flex-end',
    // alignItems: 'center',
  },
  modalView: {
    elevation: 6,
    flexGrow: 0,
    flexShrink: 1,
  },
  header: {
    flex: 0,
    flexDirection: 'row',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  title: {
    fontSize: 13,
    paddingLeft: 10,
    paddingRight: 25,
    paddingTop: 10,
    paddingBottom: 10,
    // lineHeight: 20,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    // borderTopRightRadius: 8,
    flexGrow: 0,
    flexShrink: 0,
    height: 30,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#eee',
  },
})


export default ({
  visible = false,
  hide = () => {},
  keyHide = true,
  bgHide = true,
  closeBtn = true,
  position = 'bottom',
  title = '',
  children,
}) => {
  const theme = useGetter('common', 'theme')
  const { keyboardShown, keyboardHeight } = useKeyboard()

  const closeBtnComponent = useMemo(() => closeBtn ? <TouchableOpacity style={styles.closeBtn} onPress={hide}><Icon name="close" style={{ color: theme.normal50, fontSize: 12 }} /></TouchableOpacity> : null, [closeBtn, hide, theme])

  const [centeredViewStyle, modalViewStyle] = useMemo(() => {
    switch (position) {
      case 'top':
        return [
          { justifyContent: 'flex-start' },
          {
            width: '100%',
            maxHeight: '78%',
            minHeight: '20%',
            backgroundColor: 'white',
            paddingTop: StatusBar.currentHeight,
          },
        ]
      case 'left':
        return [
          { flexDirection: 'row', justifyContent: 'flex-start' },
          {
            minWidth: '45%',
            maxWidth: '78%',
            height: '100%',
            backgroundColor: 'white',
            paddingTop: StatusBar.currentHeight,
          },
        ]
      case 'right':
        return [
          { flexDirection: 'row', justifyContent: 'flex-end' },
          {
            minWidth: '45%',
            maxWidth: '78%',
            height: '100%',
            backgroundColor: 'white',
            paddingTop: StatusBar.currentHeight,
          },
        ]
      case 'bottom':
      default:
        return [
          { justifyContent: 'flex-end' },
          {
            width: '100%',
            maxHeight: '78%',
            minHeight: '20%',
            backgroundColor: 'white',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          },
        ]
    }
  }, [position])

  return (
    <Modal visible={visible} hideModal={hide} keyHide={keyHide} bgHide={bgHide} bgColor="rgba(0,0,0,0.2)">
      <StatusBar backgroundColor="rgba(0,0,0,0)" barStyle="dark-content" translucent={true} />
      <View style={{ ...styles.centeredView, ...centeredViewStyle, paddingBottom: keyboardShown ? keyboardHeight : 0 }}>
        <View style={{ ...styles.modalView, ...modalViewStyle, backgroundColor: theme.primary }} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={{ ...styles.title, color: theme.normal40 }} numberOfLines={1}>{title}</Text>
            {closeBtnComponent}
          </View>
          {children}
        </View>
      </View>
    </Modal>
  )
}
