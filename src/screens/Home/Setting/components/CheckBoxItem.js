import React, { memo } from 'react'

import { StyleSheet, View } from 'react-native'

import CheckBox from '@/components/common/CheckBox'


export default memo(({ check, label, onChange, disabled }) => {
  return (
    <View style={styles.container}>
      <CheckBox check={check} label={label} onChange={onChange} disabled={disabled} />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    paddingLeft: 25,
    marginTop: -10,
    marginBottom: -5,
  },
})
