import { memo } from 'react'
import { View } from 'react-native'
import { useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'

const styles = createStyle({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    textAlign: 'center',
    marginLeft: 16,
  },
})

const Header = () => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  return (
    <View style={{ paddingTop: statusBarHeight, backgroundColor: theme['c-primary-light-700-alpha-500'] }}>
      <View style={styles.header}>
        <Icon name="logo" color={theme['c-primary-dark-100-alpha-300']} size={28} />
        <Text style={styles.headerText} size={28} color={theme['c-primary-dark-100-alpha-300']}>LX Music</Text>
      </View>
    </View>
  )
}

export default memo(() => {
  const theme = useTheme()

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}>
      <Header />
    </View>
  )
})

