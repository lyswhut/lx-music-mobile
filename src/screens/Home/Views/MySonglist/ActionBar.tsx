import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'

export default memo(({ onNew }: {
  onNew: () => void
}) => {
  const theme = useTheme()
  const t = useI18n()

  return (
    <View style={styles.container}>
      <Text size={16} color={theme['c-font']}>{t('nav_mysonglist')}</Text>
      <TouchableOpacity onPress={onNew} style={styles.newButton}>
        <Text size={14} color={theme['c-button-font']}>{t('my_songlist_new')}</Text>
      </TouchableOpacity>
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 10,
    paddingBottom: 10,
  },
  newButton: {
    padding: 8,
  },
})
