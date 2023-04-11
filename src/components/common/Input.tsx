import React, { useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import { TextInput, View, TouchableOpacity, StyleSheet, type TextInputProps } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'

const styles = createStyle({
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
    paddingTop: 0,
    paddingBottom: 0,
    height: 32,
    paddingLeft: 5,
    paddingRight: 0,
    flexGrow: 1,
    flexShrink: 1,
    // height: '100%',
    // width: '100%',
    fontSize: 14,
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

export interface InputProps extends TextInputProps {
  onChangeText?: (value: string) => void
  onClearText?: () => void
  clearBtn?: boolean
}


export interface InputType {
  blur: () => void
  focus: () => void
  clear: () => void
  isFocused: () => boolean
}

export default forwardRef<InputType, InputProps>(({ onChangeText, onClearText, clearBtn, style, ...props }, ref) => {
  const inputRef = useRef<TextInput>(null)
  const theme = useTheme()
  // const scaleClearBtn = useRef(new Animated.Value(0)).current

  useImperativeHandle(ref, () => ({
    blur() {
      inputRef.current?.blur()
    },
    focus() {
      inputRef.current?.focus()
    },
    clear() {
      inputRef.current?.clear()
    },
    isFocused() {
      return inputRef.current?.isFocused() ?? false
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
    inputRef.current?.clear()
    // hideClearBtn()
    onChangeText?.('')
    onClearText?.()
  }, [onChangeText, onClearText])

  const changeText = useCallback((text: string) => {
    // if (text.length) {
    //   showClearBtn()
    // } else {
    //   hideClearBtn()
    // }
    onChangeText?.(text)
  }, [onChangeText])

  return (
    <View style={styles.content}>
      <TextInput
        autoCapitalize="none"
        onChangeText={changeText}
        autoComplete="off"
        style={StyleSheet.compose({ ...styles.input, color: theme['c-font'] }, style)}
        placeholderTextColor={theme['c-primary-dark-100-alpha-600']}
        selectionColor={theme['c-primary-light-100-alpha-300']}
        ref={inputRef} {...props} />
      {/* <View style={styles.clearBtnContent}>
      <Animated.View style={{ ...styles.clearBtnContent, transform: [{ scale: scaleClearBtn }] }}> */}
        {clearBtn
          ? <View style={styles.clearBtnContent}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearText}>
                <Icon name="remove" color={theme['c-primary-dark-100-alpha-500']} size={11} />
              </TouchableOpacity>
            </View>
          : null
        }
      {/* </Animated.View>
      </View> */}
    </View>
  )
})

