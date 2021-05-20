import React, { useMemo } from 'react'
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native'
// import Button from '@/components/common/Button'
import Icon from '@/components/common/Icon'
import { useGetter, useDispatch } from '@/store'
// import { navigations } from '@/navigation'

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
    <View style={{ ...styles.header, backgroundColor: theme.primary }}>
      <StatusBar backgroundColor="rgba(0,0,0,0)" barStyle="dark-content" translucent={true} />
      <View style={styles.container}>
        {/* <View style={styles.left}> */}
          {menus.map((item, index) => <HeaderItem info={item} index={index} key={item.id} onPress={setNavActiveIndex} />)}
        {/* </View>
        <View style={styles.right}>
          <HeaderItem info={settingItem} index={-1} onPress={() => navigations.pushSettingScreen(componentId)} />
        </View> */}
      </View>
    </View>
  )
}


const styles = StyleSheet.create({
  header: {
    // backgroundColor: '#fff',
    height: 36 + StatusBar.currentHeight,
    paddingTop: StatusBar.currentHeight,
    // borderBottomWidth: BorderWidths.normal,
    // borderBottomColor: AppColors.borderColor,
    // Android shadow
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.23,
    // shadowRadius: 2.62,
    // elevation: 4,
  },
  container: {
    // width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 5,
  },
  btn: {
    // flex: 1,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: 'rgba(0,0,0,0)',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
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
