import { useEffect, useState } from 'react'
import { type SizeHandler, windowSizeTools } from '@/utils/windowSizeTools'

export default () => {
  const [size, setSize] = useState(windowSizeTools.getSize())

  useEffect(() => {
    const onChange: SizeHandler = (size) => {
      setSize(size)
    }

    const remove = windowSizeTools.onSizeChanged(onChange)
    return () => {
      remove()
    }
  }, [])

  return size
}
