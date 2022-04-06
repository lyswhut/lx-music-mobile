import React, { useMemo, useRef, useImperativeHandle, forwardRef } from 'react'
import { Pressable } from 'react-native'
import { useGetter } from '@/store'
// import { AppColors } from '@/theme'

const Btn = ({ ripple: propsRipple, children, disabled, style, ...props }, ref) => {
  const theme = useGetter('common', 'theme')
  const btnRef = useRef()
  const ripple = useMemo(() => ({
    color: theme.secondary30,
    ...(propsRipple || {}),
  }), [theme, propsRipple])

  useImperativeHandle(ref, () => ({
    measure(callback) {
      if (!btnRef.current) return
      btnRef.current.measure(callback)
    },
  }))

  return (
    <Pressable android_ripple={ripple} disabled={disabled} style={{ opacity: disabled ? 0.3 : 1, ...style }} {...props} ref={btnRef}>
      {children}
    </Pressable>
  )
}


export default forwardRef(Btn)

