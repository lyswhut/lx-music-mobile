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
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 25,
  },
  content: {
    flexGrow: 0,
  },
  title: {
    fontSize: 14,
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 15,
    paddingLeft: 15,
    // paddingRight: 15,
  },
  btn: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 15,
  },
})


export default ({
  visible = false,
  onCancel = () => {},
  onConfirm = () => {},
  keyHide,
  bgHide,
  closeBtn,
  title = '',
  text = '',
  cancelText = '',
  confirmText = '',
  showCancel = true,
  children,
}) => {
  const theme = useGetter('common', 'theme')
  const { t } = useTranslation()

  return (
    <Dialog visible={visible} hideDialog={onCancel} keyHide={keyHide} bgHide={bgHide} closeBtn={closeBtn} title={title}>
      <View style={styles.main}>
        <ScrollView style={styles.content} keyboardShouldPersistTaps={'always'}>
          {children || <Text style={{ ...styles.title, color: theme.normal }}>{text}</Text>}
        </ScrollView>
      </View>
      <View style={styles.btns}>
        {showCancel
          ? <Button style={{ ...styles.btn, backgroundColor: theme.secondary45 }} onPress={onCancel}>
              <Text style={{ color: theme.secondary_5 }}>{cancelText || t('cancel')}</Text>
            </Button>
          : null}
        <Button style={{ ...styles.btn, backgroundColor: theme.secondary45 }} onPress={onConfirm}>
          <Text style={{ fontSize: 14, color: theme.secondary_5 }}>{confirmText || t('confirm')}</Text>
        </Button>
      </View>
    </Dialog>
  )
}
