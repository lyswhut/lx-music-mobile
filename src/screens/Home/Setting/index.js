import React from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
} from 'react-native'
// import { AppColors } from '@/theme'

import Basic from './Basic'
import Player from './Player'
import LyricDesktop from './LyricDesktop'
import List from './List'
import Sync from './Sync'
import Backup from './Backup'
import Other from './Other'
import Version from './Version'
import About from './About'

const styles = StyleSheet.create({
  scrollView: {
  },
  content: {
    padding: 15,
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
        <List />
        <Sync />
        <Backup />
        <Other />
        <Version />
        <About />
        {/* <Text>setting</Text> */}
        {/* <View><Menu menus={[
          { name: '播放', id: '456' },
          { name: '删除', id: '432' },
          { name: '添加', id: '4561' },
          { name: '打开详情页', id: '4356' },
          { name: '移动', id: '4564' },
        ]}>123</Menu></View> */}
      </View>
    </ScrollView>
  )
}
