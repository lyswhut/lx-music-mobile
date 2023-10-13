import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated } from 'react-native'


const ANIMATION_DURATION = 800

export const useAnimateColor = (color: string) => {
  const anim = useMemo(() => new Animated.Value(0), [color])
  const [finished, setFinished] = useState(true)
  const currentColor = useRef(color)
  const nextColor = useMemo(() => color, [color])

  const animColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [currentColor.current, nextColor],
  })

  useEffect(() => {
    setFinished(false)
    Animated.timing(anim, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      useNativeDriver: false,
    }).start(() => {
      currentColor.current = nextColor
      setFinished(true)
    })
  }, [nextColor])

  return [animColor, finished] as const
}
