import { memo } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { useNavActiveId } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { NAV_MENUS } from '@/config/constant'
import { BorderWidths } from '@/theme'
import { setNavActiveId } from '@/core/common'
import { useI18n } from '@/lang'
import type { InitState } from '@/store/common/state'

type IdType = InitState['navActiveId']

const styles = createStyle({
  container: {
    width: '100%',
    flexDirection: 'row',
    height: 56,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 2,
  },
})

const TabItem = ({ id, icon }: { id: IdType, icon: string }) => {
  const t = useI18n()
  const activeId = useNavActiveId()
  const theme = useTheme()
  const isActive = activeId == id
  const iconColor = isActive ? theme['c-primary-font-active'] : theme['c-font-label']
  const textColor = isActive ? theme['c-primary-font'] : theme['c-font']

  return (
    <TouchableOpacity style={styles.tabItem} onPress={() => setNavActiveId(id)}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={24} color={iconColor} />
      </View>
      <Text size={12} color={textColor}>{t(id)}</Text>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const theme = useTheme()

  return (
    <View style={{
      ...styles.container,
      backgroundColor: theme['c-content-background'],
    }}>
      {NAV_MENUS.map(menu => <TabItem key={menu.id} id={menu.id} icon={menu.icon} />)}
    </View>
  )
})