import React from 'react'
import { View } from 'react-native'
import Aside from './Aside'
import PlayerBar from '../components/PlayerBar'
import StatusBar from '@/components/common/StatusBar'
import Header from './Header'
import Main from './Main'
import { createStyle } from '@/utils/tools'

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
})

export default () => {
  return (
    <>
      <StatusBar />
      <View style={styles.container}>
        <Aside />
        <View style={styles.content}>
          <Header />
          <Main />
          <PlayerBar />
        </View>
      </View>
    </>
  )
}
