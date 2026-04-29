import { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { NAV_MENUS } from '@/config/constant'
import { setNavActiveId } from '@/core/common'
import { useI18n } from '@/lang'
import { useNavActiveId } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { BorderWidths } from '@/theme'

interface BarItemProps {
  id: typeof NAV_MENUS[number]['id']
  icon: typeof NAV_MENUS[number]['icon']
}

const BarItem = ({ id, icon }: BarItemProps) => {
  const theme = useTheme()
  const t = useI18n()
  const activeId = useNavActiveId()
  const isActive = activeId == id

  /**
   * 切换底部导航页签。
   */
  const handlePress = () => {
    if (isActive) return
    setNavActiveId(id)
  }

  return (
    <TouchableOpacity
      style={[
        styles.item,
        isActive ? { backgroundColor: theme['c-primary-light-700-alpha-500'] } : null,
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <Icon
        name={icon}
        size={18}
        color={isActive ? theme['c-primary-font-active'] : theme['c-font-label']}
      />
      <Text
        style={styles.label}
        size={11}
        color={isActive ? theme['c-primary-font-active'] : theme['c-font-label']}
        numberOfLines={1}
      >
        {t(id)}
      </Text>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const theme = useTheme()
  return (
    <View style={[
      styles.container,
      {
        borderTopColor: theme['c-border-background'],
        backgroundColor: theme['c-content-background'],
      },
    ]}>
      {NAV_MENUS.map(item => <BarItem key={item.id} id={item.id} icon={item.icon} />)}
    </View>
  )
})

const styles = createStyle({
  container: {
    borderTopWidth: BorderWidths.normal,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    minHeight: 42,
    marginHorizontal: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 2,
  },
})
