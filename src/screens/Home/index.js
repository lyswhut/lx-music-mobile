import React, { useEffect } from 'react'

import { View, StyleSheet } from 'react-native'
import Header from './components/Header'
import HeaderLandscape from './components/HeaderLandscape'
// import Aside from './components/Aside'
import Main from './components/Main'
import FooterPlayer from './components/FooterPlayer'
import { useGetter, useDispatch } from '@/store'
import { useDimensions } from '@/utils/hooks'
import StatusBar from '@/components/common/StatusBar'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    flexDirection: 'row',
  },
})

const Landscape = (props) => {
  return (
    <>
      <StatusBar />
      <View style={{ ...styles.container, backgroundColor: props.theme.primary }}>
        <HeaderLandscape componentId={props.componentId} />
        <View style={{ flex: 1, flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* <Aside /> */}
          <Main />
          <FooterPlayer />
        </View>
      </View>
   </>
  )
}

export default (props) => {
  const theme = useGetter('common', 'theme')
  const { window } = useDimensions()
  const setComponentId = useDispatch('common', 'setComponentId')
  useEffect(() => {
    setComponentId({ name: 'home', id: props.componentId })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    window.height > window.width
      ? <>
        <Header componentId={props.componentId} />
        <View style={{ flex: 1, flexDirection: 'column', height: '100%', backgroundColor: theme.primary }}>
          {/* <Aside /> */}
          <Main />
          <FooterPlayer />
        </View>
      </>
      : <Landscape componentId={props.componentId} theme={theme} />
  )
}
