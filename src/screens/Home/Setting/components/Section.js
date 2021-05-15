import React, { memo } from 'react'

import { StyleSheet, View, Text } from 'react-native'
import { useGetter } from '@/store'

export default memo(({ title, children }) => {
  const theme = useGetter('common', 'theme')

  return (
    <View style={styles.container}>
      <Text style={{ ...styles.title, borderLeftColor: theme.secondary, color: theme.normal }}>{title}</Text>
      <View>
        {children}
      </View>
    </View>
  )
})


const styles = StyleSheet.create({
  container: {
    // paddingLeft: 10,
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  title: {
    borderLeftWidth: 5,
    fontSize: 16,
    paddingLeft: 10,
    marginBottom: 10,
    // lineHeight: 16,
  },
})
