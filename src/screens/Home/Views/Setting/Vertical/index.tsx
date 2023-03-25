import React, { useCallback, useRef } from 'react'
import { ScrollView, View, type DrawerLayoutAndroid } from 'react-native'
// import { getWindowSise, onDimensionChange } from '@/utils/tools'
import NavList from './NavList'
import Main, { type SettingScreenIds, type MainType } from '../Main'
import { createStyle } from '@/utils/tools'


const Content = () => {
  const drawer = useRef<DrawerLayoutAndroid>(null)
  const mainRef = useRef<MainType>(null)


  const handleChangeId = useCallback((id: SettingScreenIds) => {
    drawer.current?.closeDrawer()
    mainRef.current?.setActiveId(id)
  }, [])

  // console.log('render drawer content')

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.main} keyboardShouldPersistTaps={'always'}>
        <Main ref={mainRef} />
      </ScrollView>
      <NavList onChangeId={handleChangeId} />
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  main: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 15,
    paddingBottom: 15,
  },
})

export default Content
