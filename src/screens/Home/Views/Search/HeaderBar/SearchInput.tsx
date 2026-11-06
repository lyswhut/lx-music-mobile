import { useCallback, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import { View } from 'react-native'
import Input, { type InputType, type InputProps } from '@/components/common/Input'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { BorderWidths } from '@/theme'

export interface SearchInputProps {
  onChangeText: (text: string) => void
  onSubmit: (text: string) => void
  onBlur: () => void
  onTouchStart: () => void
}

export interface SearchInputType {
  setText: (text: string) => void
  focus: () => void
  blur: () => void
}

export default forwardRef<SearchInputType, SearchInputProps>(({ onChangeText, onSubmit, onBlur, onTouchStart }, ref) => {
  const theme = useTheme()
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)

  useImperativeHandle(ref, () => ({
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
    <View style={{ ...styles.container, backgroundColor: theme['c-primary-background'] }}>
      <Input
        ref={inputRef}
        placeholder="Search for something..."
        value={text}
        onChangeText={handleChangeText}
        style={styles.input}
        onBlur={onBlur}
        onSubmitEditing={handleSubmit}
        onClearText={handleClearText}
        onTouchStart={onTouchStart}
        clearBtn
      />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    alignItems: 'center',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 5,
    height: 32,
  },
  input: {
    borderRadius: 0,
    height: '100%',
  },
})