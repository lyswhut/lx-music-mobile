import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated } from 'react-native'


const ANIMATION_DURATION = 800

export const useAnimateColor = (color: string) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    }).start((finished) => {
      if (!finished) return
      // currentColor.current = nextColor
      setFinished(true)
    })
    requestAnimationFrame(() => {
      currentColor.current = nextColor
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextColor])

  return [animColor, finished] as const
}
