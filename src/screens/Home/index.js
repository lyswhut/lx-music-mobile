import React from 'react'

import { View } from 'react-native'
import Header from './components/Header'
// import Aside from './components/Aside'
import Main from './components/Main'
import FooterPlayer from './components/FooterPlayer'
import { AppColors } from '@/theme'


export default (props) => (
  <>
    <Header componentId={props.componentId} />
    <View style={{ flex: 1, flexDirection: 'column', height: '100%', backgroundColor: AppColors.primary }}>
      {/* <Aside /> */}
      <Main />
      <FooterPlayer />
    </View>
  </>
)
