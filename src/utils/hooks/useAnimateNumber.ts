import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated } from 'react-native'


export const DEFAULT_DURATION = 800

export const useAnimateNumber = (val: number, duration = DEFAULT_DURATION, useNativeDriver = true) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      duration,
      useNativeDriver,
    }).start((finished) => {
      if (!finished) return
      // currentNumber.current = nextNumber
      setFinished(true)
    })
    requestAnimationFrame(() => {
      currentNumber.current = nextNumber
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextNumber])

  return [animNumber, finished] as const
}

export const useAnimateOnecNumber = (val: number, toVal: number, duration = DEFAULT_DURATION, useNativeDriver = true) => {
  const anim = useMemo(() => new Animated.Value(0), [])
  const [finished, setFinished] = useState(true)

  const animNumber = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [val, toVal],
  })

  useEffect(() => {
    setFinished(false)
    Animated.timing(anim, {
      toValue: 1,
      duration,
      useNativeDriver,
    }).start((finished) => {
      if (!finished) return
      // currentNumber.current = nextNumber
      setFinished(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [animNumber, finished] as const
}
