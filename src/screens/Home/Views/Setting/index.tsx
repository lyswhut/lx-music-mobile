import { createStyle } from '@/utils/tools'
import React from 'react'
import {
  View,
  ScrollView,
} from 'react-native'
// import { AppColors } from '@/theme'

import Basic from './Basic'
import Player from './Player'
import LyricDesktop from './LyricDesktop'
import Search from './Search'
import List from './List'
import Sync from './Sync'
import Backup from './Backup'
import Other from './Other'
import Version from './Version'
import About from './About'

const styles = createStyle({
  scrollView: {
  },
  content: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 15,
    paddingBottom: 15,
    flex: 0,
  },
})

export default () => {
  return (
    <ScrollView style={styles.scrollView} keyboardShouldPersistTaps={'always'}>
      <View style={styles.content}>
        <Basic />
        <Player />
        <LyricDesktop />
        <Search />
        <List />
        <Sync />
        <Backup />
        <Other />
        <Version />
        <About />
      </View>
    </ScrollView>
  )
}
