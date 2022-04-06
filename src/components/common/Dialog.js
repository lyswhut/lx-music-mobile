import React, { useMemo } from 'react'
import { StyleSheet, View, Text, TouchableHighlight } from 'react-native'

import Modal from './Modal'
import { Icon } from '@/components/common/Icon'
import { useGetter } from '@/store'
import { useKeyboard } from '@/utils/hooks'

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    maxWidth: '90%',
    minWidth: '60%',
    maxHeight: '78%',
    backgroundColor: 'white',
    borderRadius: 4,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.25,
    // shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: 'row',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    height: 20,
  },
  title: {
    fontSize: 13,
    paddingLeft: 5,
    paddingRight: 25,
    lineHeight: 20,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    borderTopRightRadius: 4,
    flexGrow: 0,
    flexShrink: 0,
    height: 20,
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
})


export default ({
  visible = false,
  hideDialog = () => {},
  keyHide = true,
  bgHide = true,
  closeBtn = true,
  title = '',
  children,
}) => {
  const theme = useGetter('common', 'theme')
  const { keyboardShown, keyboardHeight } = useKeyboard()

  const closeBtnComponent = useMemo(() => closeBtn ? <TouchableHighlight style={styles.closeBtn} underlayColor={theme.secondary_5} onPress={hideDialog}><Icon name="close" style={{ color: theme.secondary40, fontSize: 10 }} /></TouchableHighlight> : null, [closeBtn, hideDialog, theme])

  return (
    <Modal visible={visible} hideModal={hideDialog} keyHide={keyHide} bgHide={bgHide} bgColor="rgba(0,0,0,0.2)">
      <View style={{ ...styles.centeredView, paddingBottom: keyboardShown ? keyboardHeight : 0 }}>
        <View style={{ ...styles.modalView, backgroundColor: theme.primary }} onStartShouldSetResponder={() => true}>
          <View style={{ ...styles.header, backgroundColor: theme.secondary }}>
            <Text style={{ ...styles.title, color: theme.primary }} numberOfLines={1}>{title}</Text>
            {closeBtnComponent}
          </View>
          {children}
        </View>
      </View>
    </Modal>
  )
}
