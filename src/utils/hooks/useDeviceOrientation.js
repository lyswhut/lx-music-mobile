import { useEffect, useState, useCallback } from 'react'
import { windowSizeTools } from '../windowSizeTools'


export default () => {
  const isOrientationPortrait = ({
    width,
    height,
  }) => height >= width
  const isOrientationLandscape = ({
    width,
    height,
  }) => width >= height

  const size = windowSizeTools.getSize()
  const [orientation, setOrientation] = useState({
    portrait: isOrientationPortrait(size),
    landscape: isOrientationLandscape(size),
  })

  const onChange = useCallback((size) => {
    setOrientation({
      portrait: isOrientationPortrait(size),
      landscape: isOrientationLandscape(size),
    })
  }, [])

  useEffect(() => {
    const changeEvent = windowSizeTools.onSizeChanged(onChange)

    return () => {
      changeEvent.remove()
    }
  }, [orientation.portrait, orientation.landscape, onChange])

  return orientation
}
