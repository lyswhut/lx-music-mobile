import { useEffect, useState } from 'react'
import { Keyboard } from 'react-native'

export default () => {
  const [shown, setShown] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  const handleKeyboardDidShow = e => {
    setShown(true)
    setKeyboardHeight(e.endCoordinates.height)
  }

  const handleKeyboardDidHide = () => {
    setShown(false)
    setKeyboardHeight(0)
  }

  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', handleKeyboardDidShow)
    Keyboard.addListener('keyboardDidHide', handleKeyboardDidHide)

    return () => {
      Keyboard.removeListener('keyboardDidShow', handleKeyboardDidShow)
      Keyboard.removeListener('keyboardDidHide', handleKeyboardDidHide)
    }
  }, [])

  return {
    keyboardShown: shown,
    keyboardHeight,
  }
}
