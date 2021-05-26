import React, { useRef, useImperativeHandle, forwardRef, useCallback, useEffect, useState } from 'react'
import { TextInput, StyleSheet, View, TouchableOpacity, Animated } from 'react-native'
import Icon from './Icon'
import { useGetter } from '@/store'

const Input = ({ onChangeText, onClearText, clearBtn, ...props }, ref) => {
  const inputRef = useRef()
  const theme = useGetter('common', 'theme')
  // const scaleClearBtn = useRef(new Animated.Value(0)).current

  useImperativeHandle(ref, () => ({
    blur() {
      if (!inputRef.current) return
      inputRef.current.blur()
    },
    focus() {
      if (!inputRef.current) return
      inputRef.current.focus()
    },
    clear() {
      inputRef.current.clear()
    },
    isFocused() {
      return inputRef.current.isFocused()
    },
  }))

  // const showClearBtn = useCallback(() => {
  //   Animated.timing(scaleClearBtn, {
  //     toValue: 1,
  //     duration: 200,
  //     useNativeDriver: true,
  //   }).start()
  // }, [scaleClearBtn])
  // const hideClearBtn = useCallback(() => {
  //   Animated.timing(scaleClearBtn, {
  //     toValue: 0,
  //     duration: 200,
  //     useNativeDriver: true,
  //   }).start()
  // }, [scaleClearBtn])

  const clearText = useCallback(() => {
    inputRef.current.clear()
    // hideClearBtn()
    onClearText && onClearText()
  }, [inputRef, onClearText])

  const changeText = useCallback(text => {
    // if (text.length) {
    //   showClearBtn()
    // } else {
    //   hideClearBtn()
    // }
    onChangeText && onChangeText(text)
  }, [onChangeText])

  return (
    <View style={styles.content}>
      <TextInput autoCapitalize="none" onChangeText={changeText} autoCompleteType="off" style={{ ...styles.input, color: theme.normal }} ref={inputRef} {...props} />
      {/* <View style={styles.clearBtnContent}>
      <Animated.View style={{ ...styles.clearBtnContent, transform: [{ scale: scaleClearBtn }] }}> */}
        {clearBtn
          ? <View style={styles.clearBtnContent}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearText}>
                <Icon name="remove" style={{ fontSize: 14, color: theme.normal20 }} />
              </TouchableOpacity>
            </View>
          : null
        }
      {/* </Animated.View>
      </View> */}
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    // backgroundColor: 'rgba(0,0,0,0.1)',
    flexGrow: 1,
    flexShrink: 1,
    // height: 38,
    alignItems: 'center',
    // paddingRight: 5,
  },
  input: {
    // backgroundColor: 'rgba(0,0,0,0.1)',
    // backgroundColor: 'white',
    borderRadius: 2,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 5,
    paddingRight: 0,
    flexGrow: 1,
    flexShrink: 1,
    height: '100%',
  },
  clearBtnContent: {
    flexGrow: 0,
    flexShrink: 0,
  },
  clearBtn: {
    height: '70%',
    paddingLeft: 5,
    paddingRight: 5,
    justifyContent: 'center',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
})

export default forwardRef(Input)

