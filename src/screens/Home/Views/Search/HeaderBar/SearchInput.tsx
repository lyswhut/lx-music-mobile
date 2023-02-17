import React, { useCallback, useRef, forwardRef, useImperativeHandle, useState } from 'react'
// import { StyleSheet } from 'react-native'
import Input, { type InputType, type InputProps } from '@/components/common/Input'

export interface SearchInputProps {
  onChangeText: (text: string) => void
  onSubmit: (text: string) => void
  onBlur: () => void
  onTouchStart: () => void
}

export interface SearchInputType {
  setText: (text: string) => void
  // getText: () => string
  focus: () => void
  blur: () => void
}

export default forwardRef<SearchInputType, SearchInputProps>(({ onChangeText, onSubmit, onBlur, onTouchStart }, ref) => {
  // const theme = useTheme()
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)

  useImperativeHandle(ref, () => ({
    // getText() {
    //   return text.trim()
    // },
    setText(text) {
      setText(text)
    },
    focus() {
      inputRef.current?.focus()
    },
    blur() {
      inputRef.current?.blur()
    },
  }))

  const handleChangeText = (text: string) => {
    setText(text)
    onChangeText(text.trim())
  }

  const handleClearText = useCallback(() => {
    setText('')
    onChangeText('')
    onSubmit('')
  }, [onChangeText, onSubmit])

  const handleSubmit = useCallback<NonNullable<InputProps['onSubmitEditing']>>(({ nativeEvent: { text } }) => {
    onSubmit(text)
  }, [onSubmit])

  return (
    <Input
      ref={inputRef}
      placeholder="Search for something..."
      value={text}
      onChangeText={handleChangeText}
      // style={{ ...styles.input, backgroundColor: theme['c-primary-input-background'] }}
      onBlur={onBlur}
      onSubmitEditing={handleSubmit}
      onClearText={handleClearText}
      onTouchStart={onTouchStart}
      clearBtn
    />
  )
})
