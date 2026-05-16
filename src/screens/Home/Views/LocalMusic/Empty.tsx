import { View } from 'react-native'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'

export default () => {
  const t = useI18n()
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <Text size={16} color={theme['c-font-label']}>
        {t('local_music_empty')}
      </Text>
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
