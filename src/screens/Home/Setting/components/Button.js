import React, { memo } from 'react'

import { StyleSheet, View, Text } from 'react-native'

import Button from '@/components/common/Button'
import { useGetter } from '@/store'


export default memo(({ children, disabled, onPress }) => {
  const theme = useGetter('common', 'theme')

  return (
    <Button style={{ ...styles.button, backgroundColor: theme.secondary40 }} onPress={onPress} disabled={disabled}>
      <Text style={{ ...styles.text, color: theme.secondary_5 }}>{children}</Text>
    </Button>
  )
})

const styles = StyleSheet.create({
  button: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 4,
    marginRight: 10,
  },
  text: {
    fontSize: 12,
  },
})
