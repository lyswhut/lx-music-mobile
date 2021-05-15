import React from 'react'
import { StyleSheet, View } from 'react-native'

import List from './List'
import ListDetail from './ListDetail'

const SongList = () => {
  return (
    <View style={styles.container}>
      <List />
      <ListDetail />
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
})

export default SongList

