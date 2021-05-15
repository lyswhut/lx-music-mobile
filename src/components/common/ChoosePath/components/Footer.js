import React, { memo } from 'react'
import { View, StyleSheet, Text } from 'react-native'
import { useTranslation } from '@/plugins/i18n'
import { useGetter } from '@/store'
import Button from '@/components/common/Button'
import { BorderWidths } from '@/theme'

export default memo(({ onConfirm, hide, dirOnly }) => {
  const { t } = useTranslation()
  const theme = useGetter('common', 'theme')

  return (
    <View style={{ ...styles.footer, borderTopColor: theme.secondary30 }} >
      <Button style={{ ...styles.footerBtn, backgroundColor: theme.secondary45, width: dirOnly ? '50%' : '100%' }} onPress={hide}>
        <Text style={{ color: theme.secondary_5 }}>{t('cancel')}</Text>
      </Button>
      {dirOnly
        ? <Button style={{ ...styles.footerBtn, backgroundColor: theme.secondary45 }} onPress={onConfirm}>
            <Text style={{ fontSize: 14, color: theme.secondary_5 }}>{t('confirm')}</Text>
          </Button>
        : null
      }
    </View>
  )
})

const styles = StyleSheet.create({
  footer: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: 'row',
    borderTopWidth: BorderWidths.normal2,
  },
  footerBtn: {
    width: '50%',
    paddingTop: 15,
    paddingBottom: 15,
    alignItems: 'center',
  },
})
