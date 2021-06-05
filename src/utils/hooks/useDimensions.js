import { useEffect, useState } from 'react'
import { Dimensions } from 'react-native'
import { getWindowSise } from '@/utils/tools'

export default () => {
  const [dimensions, setDimensions] = useState({
    window: getWindowSise(),
    screen: Dimensions.get('screen'),
  })

  useEffect(() => {
    const onChange = ({ window, screen }) => {
      setDimensions({ window: getWindowSise(window), screen })
    }

    Dimensions.addEventListener('change', onChange)

    return () => Dimensions.removeEventListener('change', onChange)
  }, [])

  return dimensions
}
