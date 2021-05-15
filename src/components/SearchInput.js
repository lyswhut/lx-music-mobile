import React, { useRef, forwardRef, useImperativeHandle } from 'react'
import { View, StyleSheet } from 'react-native'
import Input from './common/Input'

const SearchInput = (props, ref) => {
  const textInputRef = useRef()

  useImperativeHandle(ref, () => ({
    blur() {
      if (!textInputRef.current) return
      textInputRef.current.blur()
    },
  }))

  return (
    <View style={{ ...styles.container, ...props.styles }}>
      <Input {...props} ref={textInputRef} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    // backgroundColor: AppColors.secondary40,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
    width: '100%',
    // borderBottomLeftRadius: 10,
    // borderBottomRightRadius: 10,
  },
})

export default forwardRef(SearchInput)
