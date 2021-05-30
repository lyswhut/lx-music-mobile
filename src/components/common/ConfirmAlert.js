import React, { useMemo } from 'react'
import { StyleSheet, View, Text, ScrollView } from 'react-native'
import { useTranslation } from '@/plugins/i18n'
import Dialog from './Dialog'
import Button from './Button'
import { useGetter } from '@/store'

const styles = StyleSheet.create({
  main: {
    // flexGrow: 0,
    flexShrink: 1,
    marginTop: 15,
    marginLeft: 5,
    marginRight: 5,
    marginBottom: 25,
  },
  content: {
    flexGrow: 0,
    paddingLeft: 10,
    paddingRight: 10,
  },
  title: {
    fontSize: 14,
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 15,
    // paddingRight: 15,
  },
  btnsDirection: {
    paddingLeft: 15,
  },
  btnsReversedDirection: {
    paddingLeft: 15,
    flexDirection: 'row-reverse',
  },
  btn: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
    alignItems: 'center',
    borderRadius: 4,
  },
  btnDirection: {
    marginRight: 15,
  },
  btnReversedDirection: {
    marginLeft: 15,
  },
})


export default ({
  visible = false,
  onHide = () => {},
  onCancel,
  onConfirm = () => {},
  keyHide,
  bgHide,
  closeBtn,
  title = '',
  text = '',
  cancelText = '',
  confirmText = '',
  showConfirm = true,
  children,
  reverseBtn = false,
}) => {
  const theme = useGetter('common', 'theme')
  const { t } = useTranslation()

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onHide()
    }
  }

  return (
    <Dialog visible={visible} hideDialog={onHide} keyHide={keyHide} bgHide={bgHide} closeBtn={closeBtn} title={title}>
      <View style={styles.main}>
        <ScrollView style={styles.content} keyboardShouldPersistTaps={'always'}>
          {children || <Text style={{ ...styles.title, color: theme.normal }}>{text}</Text>}
        </ScrollView>
      </View>
      <View style={{ ...styles.btns, ...(reverseBtn ? styles.btnsReversedDirection : styles.btnsDirection) }}>
        <Button style={{ ...styles.btn, ...(reverseBtn ? styles.btnReversedDirection : styles.btnDirection), backgroundColor: theme.secondary45 }} onPress={handleCancel}>
          <Text style={{ color: theme.secondary_5 }}>{cancelText || t('cancel')}</Text>
        </Button>
        {showConfirm
          ? <Button style={{ ...styles.btn, ...(reverseBtn ? styles.btnReversedDirection : styles.btnDirection), backgroundColor: theme.secondary45 }} onPress={onConfirm}>
              <Text style={{ fontSize: 14, color: theme.secondary_5 }}>{confirmText || t('confirm')}</Text>
            </Button>
          : null}
      </View>
    </Dialog>
  )
}
