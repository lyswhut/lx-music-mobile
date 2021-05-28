import React from 'react'
import { StyleSheet, View } from 'react-native'

import List from './List'
import MenuBar from './MenuBar'

import { useLayout } from '@/utils/hooks'

export default () => {
  const { onLayout, ...layout } = useLayout()
  return (
    <View style={styles.container} onLayout={onLayout}>
      <MenuBar />
      <List width={layout.width} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
})

