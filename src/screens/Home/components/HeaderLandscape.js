import React, { useMemo } from 'react'
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native'
// import Button from '@/components/common/Button'
import Icon from '@/components/common/Icon'
import { useGetter, useDispatch } from '@/store'
// import { navigations } from '@/navigation'
import { BorderWidths } from '@/theme'

const useActive = index => {
  const activeIndex = useGetter('common', 'navActiveIndex')
  return index === activeIndex
}

const HeaderItem = ({ info, index, onPress }) => {
  const theme = useGetter('common', 'theme')
  const isActive = useActive(index)
  // console.log(theme)
  const components = useMemo(() => (
    <TouchableOpacity style={styles.btn} onPress={() => !isActive && onPress(index)}>
      <Icon name={info.icon} style={{ ...styles.icon, color: isActive ? theme.secondary : theme.normal10 }} size={18} />
      {/* <Text style={{ ...style.btnText, color: isActive ? theme.secondary : theme.normal10 }}>{info.name}</Text> */}
    </TouchableOpacity>
  ), [isActive, theme, index, info.icon, onPress])

  return components
}

// const settingItem = {
//   icon: 'setting',
// }
const Header = ({ componentId }) => {
  const menus = useGetter('common', 'navMenus')
  const setNavActiveIndex = useDispatch('common', 'setNavActiveIndex')
  const theme = useGetter('common', 'theme')

  return (
    <View style={{ ...styles.container, borderRightColor: theme.borderColor, backgroundColor: theme.primary }}>
      {/* <View style={styles.left}> */}
        {menus.map((item, index) => <HeaderItem info={item} index={index} key={item.id} onPress={setNavActiveIndex} />)}
      {/* </View>
      <View style={styles.right}>
        <HeaderItem info={settingItem} index={-1} onPress={() => navigations.pushSettingScreen(componentId)} />
      </View> */}
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    // height: 36,
    // width: '100%',
    // flexDirection: 'row',
    borderRightWidth: BorderWidths.normal,
    justifyContent: 'center',
    zIndex: 10,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 5,
  },
  btn: {
    // flex: 1,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    color: 'green',
  },
  btnText: {
    fontSize: 16,
    // color: 'white',
  },
  icon: {
    paddingLeft: 4,
    paddingRight: 4,
  },
})


export default Header
