import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'

export default memo(({ onConfirm, onHide, dirOnly, selectedCount = 0 }: {
  onConfirm: () => void
  onHide: () => void
  dirOnly: boolean
  selectedCount?: number
}) => {
  const t = useI18n()
  const theme = useTheme()
  const showConfirm = dirOnly || selectedCount > 0

  return (
    <View style={{ ...styles.footer, backgroundColor: theme['c-content-background'] }}>
      <Button style={{ ...styles.footerBtn, width: showConfirm ? '50%' : '100%' }} onPress={onHide}>
        <Text color={theme['c-button-font']}>{t('cancel')}</Text>
      </Button>
      {showConfirm
        ? <Button style={styles.footerBtn} onPress={onConfirm}>
            <Text color={theme['c-button-font']}>{selectedCount > 0 ? `${t('confirm')}(${selectedCount})` : t('confirm')}</Text>
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
    // borderTopWidth: BorderWidths.normal,
    elevation: 8,
  },
  footerBtn: {
    width: '50%',
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
})
