import React, { memo } from 'react'
import { ScrollView, StatusBar, TouchableOpacity, View } from 'react-native'
import { useI18n } from '@/lang'
import { useNavActiveId } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { NAV_MENUS } from '@/config/constant'
import type { InitState } from '@/store/common/state'
// import { navigations } from '@/navigation'
// import commonState from '@/store/common/state'
import { exitApp, setNavActiveId } from '@/core/common'
import Text from '@/components/common/Text'

const styles = createStyle({
  container: {
    flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
    // padding: 10,
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
  menus: {
    flex: 1,
  },
  list: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    paddingTop: 13,
    paddingBottom: 13,
    paddingLeft: 25,
    paddingRight: 25,
    alignItems: 'center',
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  iconContent: {
    width: 24,
    alignItems: 'center',
  },
  text: {
    paddingLeft: 20,
    // fontWeight: '500',
  },
})

const Header = () => {
  const theme = useTheme()
  return (
    <View style={{ paddingTop: StatusBar.currentHeight, backgroundColor: theme['c-primary-light-700-alpha-500'] }}>
      <View style={styles.header}>
        <Icon name="logo" color={theme['c-primary-dark-100-alpha-300']} size={28} />
        <Text style={styles.headerText} size={28} color={theme['c-primary-dark-100-alpha-300']}>LX Music</Text>
      </View>
    </View>
  )
}

type IdType = InitState['navActiveId'] | 'nav_exit'

const MenuItem = ({ id, icon, onPress }: {
  id: IdType
  icon: string
  onPress: (id: IdType) => void
}) => {
  const t = useI18n()
  const activeId = useNavActiveId()
  const theme = useTheme()

  return activeId == id
    ? <View style={styles.menuItem}>
        <View style={styles.iconContent}>
          <Icon name={icon} size={20} color={theme['c-primary-font-active']} />
        </View>
        <Text style={styles.text} color={theme['c-primary-font']}>{t(id)}</Text>
      </View>
    : <TouchableOpacity style={styles.menuItem} onPress={() => { onPress(id) }}>
        <View style={styles.iconContent}>
          <Icon name={icon} size={20} color={theme['c-font-label']} />
        </View>
        <Text style={styles.text}>{t(id)}</Text>
      </TouchableOpacity>
}

export default memo(() => {
  const theme = useTheme()
  // console.log('render drawer nav')

  const handlePress = (id: IdType) => {
    if (id == 'nav_exit') {
      exitApp()
      return
    }
    // switch (id) {
    //   case 'nav_search':
    //     break
    //   case 'nav_songlist':
    //     break
    //   case 'nav_top':
    //     break
    //   case 'nav_love':
    //     break
    //   case 'nav_setting':
    //     // void InteractionManager.runAfterInteractions(() => {
    //     //   navigations.pushSettingScreen(commonState.componentIds.home)
    //     // })
    //     return
    // }
    global.app_event.changeMenuVisible(false)
    setNavActiveId(id)
  }

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}>
      <Header />
      <ScrollView style={styles.menus}>
        <View style={styles.list}>
          {NAV_MENUS.map(menu => <MenuItem key={menu.id} id={menu.id} icon={menu.icon} onPress={handlePress} />)}
        </View>
      </ScrollView>
      <MenuItem id="nav_exit" icon="exit2" onPress={handlePress} />
    </View>
  )
})

