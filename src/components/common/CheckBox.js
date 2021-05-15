import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native'
import CheckBox from '@react-native-community/checkbox'

import { useGetter } from '@/store'

export default ({ check, label, children, onChange, disabled = false, need = false, marginRight = 0, marginBottom = 0 }) => {
  const theme = useGetter('common', 'theme')
  const [isDisabled, setDisabled] = useState(false)
  const tintColors = useMemo(() => {
    return {
      true: theme.secondary,
      false: theme.normal35,
    }
  }, [theme])
  const disabledTintColors = useMemo(() => {
    return {
      true: theme.secondary30,
      false: theme.normal60,
    }
  }, [theme])

  useEffect(() => {
    if (need) {
      if (check) {
        if (!isDisabled) setDisabled(true)
      } else {
        if (isDisabled) setDisabled(false)
      }
    } else {
      isDisabled && setDisabled(false)
    }
  }, [check, need, isDisabled])

  const handleLabelPress = useCallback(() => {
    if (isDisabled) return
    onChange && onChange(!check)
  }, [isDisabled, onChange, check])


  const contentStyle = StyleSheet.compose(styles.content, { marginBottom })
  const labelStyle = StyleSheet.compose(styles.label, { marginRight })

  return (
    disabled
      ? (
          <View style={contentStyle}>
            <CheckBox style={styles.checkbox} value={check} disabled={true} tintColors={disabledTintColors} />
            <View style={labelStyle}>{label ? <Text style={{ ...styles.name, color: theme.normal40 }}>{label}</Text> : children}</View>
          </View>
        )
      : (
          <View style={contentStyle}>
            <CheckBox value={check} disabled={isDisabled} onValueChange={onChange} tintColors={tintColors} />
            <TouchableOpacity style={labelStyle} activeOpacity={0.5} onPress={handleLabelPress}>
              {label ? <Text style={{ ...styles.name, color: theme.normal }}>{label}</Text> : children}
            </TouchableOpacity>
          </View>
        )
  )
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 0,
    flexShrink: 1,
    marginRight: 15,
    alignItems: 'center',
    flexDirection: 'row',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  checkbox: {
    flex: 0,
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  label: {
    flexGrow: 0,
    flexShrink: 1,
    // marginRight: 15,
    // alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.2)',
    // paddingRight: 8,
  },
  name: {
    marginTop: 2,
    fontSize: 13,
  },
})

