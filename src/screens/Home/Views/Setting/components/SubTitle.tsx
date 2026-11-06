import { memo } from 'react'

import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'

export default memo(({ title, children }: {
  title: string
  children: React.ReactNode | React.ReactNode[]
}) => {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title} size={14} color={theme['c-primary-font-active']}>{title}</Text>
        <View style={{ ...styles.divider, backgroundColor: 'rgba(76, 175, 80, 0.25)' }} />
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  )
})


const styles = createStyle({
  container: {
    marginBottom: 18,
  },
  card: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    paddingTop: 10,
    paddingBottom: 12,
    marginVertical: 8,
  },
  title: {
    marginLeft: 15,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  divider: {
    height: 1.6,
    marginBottom: 10,
  },
  content: {
    paddingHorizontal: 15,
  },
})
