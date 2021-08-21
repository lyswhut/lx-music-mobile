import React, { memo } from 'react'

import { StyleSheet, View, Text } from 'react-native'
import { useGetter } from '@/store'

export default memo(({ title, children }) => {
  const theme = useGetter('common', 'theme')

  return (
    <View style={styles.container}>
      <Text style={{ ...styles.title, color: theme.normal }}>{title}</Text>
      {children}
    </View>
  )
})


const styles = StyleSheet.create({
  container: {
    paddingLeft: 25,
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    marginLeft: -10,
    marginBottom: 6,
    // lineHeight: 16,
  },
})
