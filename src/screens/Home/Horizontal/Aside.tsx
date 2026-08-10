import { memo } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { useCarBottomPadding, useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { confirmDialog, createStyle, exitApp as backHome } from '@/utils/tools'
import { NAV_MENUS } from '@/config/constant'
import type { InitState } from '@/store/common/state'
import { exitApp, setNavActiveId } from '@/core/common'
import { BorderWidths } from '@/theme'
import { useSettingValue } from '@/store/setting/hook'

const NAV_WIDTH = 76

const styles = createStyle({
  container: {
    flexGrow: 0,
    borderRightWidth: BorderWidths.normal,
    paddingBottom: 10,
    width: NAV_WIDTH,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    textAlign: 'center',
    marginLeft: 16,
  },
  menus: {
    flex: 1,
  },
  list: {
    paddingBottom: 10,
  },
  menuItem: {
    marginHorizontal: 5,
    marginVertical: 3,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    paddingTop: 3,
    textAlign: 'center',
  },
})

const Header = () => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  return (
    <View style={{ paddingTop: statusBarHeight }}>
      <View style={styles.header}>
        <Icon name="logo" color={theme['c-primary-dark-100-alpha-300']} size={24} />
      </View>
    </View>
  )
}

type IdType = InitState['navActiveId'] | 'nav_exit' | 'back_home'

const MenuItem = ({ id, icon, onPress }: {
  id: IdType
  icon: string
  onPress: (id: IdType) => void
}) => {
  const t = useI18n()
  const activeId = useNavActiveId()
  const theme = useTheme()
  const isActive = activeId == id

  return (
    <TouchableOpacity
      style={{
        ...styles.menuItem,
        backgroundColor: isActive ? theme['c-primary-background-hover'] : 'transparent',
      }}
      activeOpacity={0.6}
      onPress={() => { onPress(id) }}
    >
      <View style={styles.iconContent}>
        <Icon name={icon} size={22} color={isActive ? theme['c-primary-font-active'] : theme['c-font-label']} />
        <Text style={styles.text} size={11} color={isActive ? theme['c-primary-font-active'] : theme['c-font-label']} numberOfLines={1}>{t(id)}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const theme = useTheme()
  const showBackBtn = useSettingValue('common.showBackBtn')
  const showExitBtn = useSettingValue('common.showExitBtn')
  const carBottomPadding = useCarBottomPadding()

  const handlePress = (id: IdType) => {
    switch (id) {
      case 'nav_exit':
        void confirmDialog({
          message: global.i18n.t('exit_app_tip'),
          confirmButtonText: global.i18n.t('list_remove_tip_button'),
        }).then(isExit => {
          if (!isExit) return
          exitApp('Exit Btn')
        })
        return
      case 'back_home':
        backHome()
        return
    }

    global.app_event.changeMenuVisible(false)
    setNavActiveId(id)
  }

  return (
    <View style={{ ...styles.container, borderRightColor: theme['c-border-background'], paddingBottom: 10 + carBottomPadding }}>
      <Header />
      <ScrollView style={styles.menus}>
        <View style={styles.list}>
          {NAV_MENUS.map(menu => <MenuItem key={menu.id} id={menu.id} icon={menu.icon} onPress={handlePress} />)}
        </View>
      </ScrollView>
      {
        showBackBtn ? <MenuItem id="back_home" icon="home" onPress={handlePress} /> : null
      }
      {
        showExitBtn ? <MenuItem id="nav_exit" icon="exit2" onPress={handlePress} /> : null
      }
    </View>
  )
})

