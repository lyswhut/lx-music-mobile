import { useEffect, useRef } from 'react'

export function useUnmounted() {
  const isUnmountedRef = useRef(false)
  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  return isUnmountedRef
}
