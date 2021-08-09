import React, { memo, useState, useCallback, useEffect, useRef } from 'react'

import { StyleSheet, View, Text, Keyboard } from 'react-native'
import { useGetter } from '@/store'
import Input from '@/components/common/Input'

export default memo(({ value, label, onChange, ...props }) => {
  const [text, setText] = useState(value)
  const textRef = useRef(value)
  const isMountRef = useRef(false)
  const inputRef = useRef()
  const theme = useGetter('common', 'theme')
  const saveValue = useCallback(() => {
    onChange && onChange(text, value => {
      if (!isMountRef.current) return
      const newValue = String(value)
      setText(newValue)
      textRef.current = newValue
    })
  }, [onChange, text])
  useEffect(() => {
    isMountRef.current = true
    return () => {
      isMountRef.current = false
    }
  }, [])
  useEffect(() => {
    const handleKeyboardDidHide = () => {
      if (!inputRef.current.isFocused()) return
      onChange && onChange(textRef.current, value => {
        if (!isMountRef.current) return
        const newValue = String(value)
        setText(newValue)
        textRef.current = newValue
      })
    }
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', handleKeyboardDidHide)

    return () => {
      keyboardDidHide.remove()
    }
  }, [onChange])
  useEffect(() => {
    if (value != text) {
      const newValue = String(value)
      setText(newValue)
      textRef.current = newValue
    }
  }, [value])
  const handleSetSelectMode = useCallback(text => {
    setText(text)
    textRef.current = text
  }, [])
  return (
    <View style={styles.container}>
      <Text style={{ ...styles.label, color: theme.normal }}>{label}</Text>
      <Input
        value={text}
        ref={inputRef}
        onChangeText={handleSetSelectMode}
        style={{ ...styles.input, backgroundColor: theme.secondary40 }}
        {...props}
        onBlur={saveValue}
       />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    paddingLeft: 25,
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    flexGrow: 1,
    flexShrink: 1,
    borderRadius: 4,
    paddingTop: 2,
    paddingBottom: 2,
    fontSize: 12,
    maxWidth: 300,
  },
})
