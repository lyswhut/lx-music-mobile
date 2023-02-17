import React, { useEffect, useRef } from 'react'
import { type DrawerLayoutAndroid } from 'react-native'
// import { getWindowSise, onDimensionChange } from '@/utils/tools'
import DrawerNav from './DrawerNav'
import Header from './Header'
import Main from '../components/Main'
import { useSettingValue } from '@/store/setting/hook'
import { COMPONENT_IDS } from '@/config/constant'
import DrawerLayoutFixed from '@/components/common/DrawerLayoutFixed'
import { scaleSizeW } from '@/utils/pixelRatio'

const MAX_WIDTH = scaleSizeW(300)

const Content = () => {
  const drawer = useRef<DrawerLayoutAndroid>(null)
  const drawerLayoutPosition = useSettingValue('common.drawerLayoutPosition')

  useEffect(() => {
    const changeVisible = (visible: boolean) => {
      if (visible) {
        drawer.current?.openDrawer()
      } else {
        drawer.current?.closeDrawer()
      }
    }

    global.app_event.on('changeMenuVisible', changeVisible)

    return () => {
      global.app_event.off('changeMenuVisible', changeVisible)
    }
  }, [])

  const navigationView = () => <DrawerNav />
  // console.log('render drawer content')

  return (
    <DrawerLayoutFixed
      ref={drawer}
      widthPercentage={0.7}
      widthPercentageMax={MAX_WIDTH}
      visibleNavNames={[COMPONENT_IDS.home]}
      // drawerWidth={width}
      drawerPosition={drawerLayoutPosition}
      renderNavigationView={navigationView}
    >
      <Header />
      <Main />
      {/* <View style={styles.container}>
      </View> */}
    </DrawerLayoutFixed>
  )
}

// const styles = createStyle({
//   container: {
//     flex: 1,
//   },
// })

export default Content
