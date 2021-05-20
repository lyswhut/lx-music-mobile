import React, { useEffect } from 'react'

import { View } from 'react-native'
import Header from './components/Header'
// import Aside from './components/Aside'
import Main from './components/Main'
import FooterPlayer from './components/FooterPlayer'
import { useGetter, useDispatch } from '@/store'


export default (props) => {
  const theme = useGetter('common', 'theme')
  const setComponentId = useDispatch('common', 'setComponentId')
  useEffect(() => {
    setComponentId({ name: 'home', id: props.componentId })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Header componentId={props.componentId} />
      <View style={{ flex: 1, flexDirection: 'column', height: '100%', backgroundColor: theme.primary }}>
        {/* <Aside /> */}
        <Main />
        <FooterPlayer />
      </View>
    </>
  )
}
