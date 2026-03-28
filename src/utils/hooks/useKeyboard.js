import { useEffect, useState } from 'react'
import { Keyboard } from 'react-native'

export default () => {
  const [shown, setShown] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  const handleKeyboardDidShow = e => {
    // const isShow = e.endCoordinates.height > 115
    // setShown(isShow)
    // setKeyboardHeight(isShow ? e.endCoordinates.height : 0)
    setShown(true)
    setKeyboardHeight(e.endCoordinates.height)
  }

  const handleKeyboardDidHide = () => {
    setShown(false)
    setKeyboardHeight(0)
  }

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', handleKeyboardDidShow)
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', handleKeyboardDidHide)

    return () => {
      keyboardDidShow.remove()
      keyboardDidHide.remove()
    }
  }, [])

  return {
    keyboardShown: shown,
    keyboardHeight,
  }
}
