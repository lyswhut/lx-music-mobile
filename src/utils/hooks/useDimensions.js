import { useEffect, useState } from 'react'
import { Dimensions } from 'react-native'

export default () => {
  const [dimensions, setDimensions] = useState({
    window: Dimensions.get('window'),
    screen: Dimensions.get('screen'),
  })

  useEffect(() => {
    const onChange = ({ window, screen }) => {
      setDimensions({ window, screen })
    }

    Dimensions.addEventListener('change', onChange)

    return () => Dimensions.removeEventListener('change', onChange)
  }, [])

  return dimensions
}
