import { TouchableOpacity } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

interface Props {
  onPress: () => void
}

export default ({ onPress }: Props) => {
  const theme = useTheme()
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: theme['c-content-background'] }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon name="chevron-left" size={20} color={theme['c-primary']} style={styles.icon} />
    </TouchableOpacity>
  )
}

const styles = createStyle({
  btn: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
  icon: {
    transform: [{ rotate: '90deg' }],
  },
})
