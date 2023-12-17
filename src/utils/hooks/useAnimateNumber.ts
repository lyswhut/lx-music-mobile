import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated } from 'react-native'


const ANIMATION_DURATION = 800

export const useAnimateNumber = (val: number) => {
  const anim = useMemo(() => new Animated.Value(0), [val])
  const [finished, setFinished] = useState(true)
  const currentNumber = useRef(val)
  const nextNumber = useMemo(() => val, [val])

  const animNumber = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [currentNumber.current, nextNumber],
  })

  useEffect(() => {
    setFinished(false)
    Animated.timing(anim, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      useNativeDriver: false,
    }).start((finished) => {
      if (!finished) return
      // currentNumber.current = nextNumber
      setFinished(true)
    })
    requestAnimationFrame(() => {
      currentNumber.current = nextNumber
    })
  }, [nextNumber])

  return [animNumber, finished] as const
}
