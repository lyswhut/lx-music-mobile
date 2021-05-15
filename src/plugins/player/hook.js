import { useRef, useEffect, useState, useCallback } from 'react'
import {
  getState,
  getPosition,
  getBufferedPosition,
  getDuration,
  TrackPlayerEvents,
  useTrackPlayerEvents,
  STATE_PLAYING,
  STATE_BUFFERING,
} from 'react-native-track-player'

const useWhenPlaybackStateChanges = callback => {
  useTrackPlayerEvents(
    [TrackPlayerEvents.PLAYBACK_STATE],
    ({ state }) => {
      callback(state)
    },
  )
  useEffect(() => {
    let didCancel = false
    const fetchPlaybackState = async() => {
      const playbackState = await getState()
      if (!didCancel) {
        callback(playbackState)
      }
    }
    fetchPlaybackState()
    return () => { didCancel = true }
  }, [callback])
}

const usePlaybackStateIs = states => {
  const [is, setIs] = useState()
  useWhenPlaybackStateChanges(state => {
    const newIs = !!states && states.includes(state)
    if (is != newIs) setIs(newIs)
  })

  return is
}

// const useInterval = (callback, delay) => {
//   const savedCallback = useRef()

//   useEffect(() => {
//     savedCallback.current = callback
//   })

//   useEffect(() => {
//     if (!delay) return
//     savedCallback.current()
//     const id = setInterval(savedCallback.current, delay)
//     return () => clearInterval(id)
//   }, [delay])
// }

const pollTrackPlayerStates = [
  STATE_PLAYING,
  STATE_BUFFERING,
]

export const useTrackPlayerProgress = time => {
  const [state, setState] = useState({
    position: 0,
    bufferedPosition: 0,
    duration: 0,
  })
  const isUnmountedRef = useRef(true)
  const intervalRef = useRef(null)

  useEffect(() => {
    isUnmountedRef.current = false
    return () => { isUnmountedRef.current = true }
  })

  const getProgress = useCallback(() => {
    Promise.all([
      getPosition(),
      getBufferedPosition(),
      getDuration(),
    ]).then(([position, bufferedPosition, duration]) => {
      if (isUnmountedRef.current) return
      setState({ position, bufferedPosition, duration })
    })
  }, [])

  const needsPoll = usePlaybackStateIs(pollTrackPlayerStates)

  useEffect(() => {
    if (needsPoll) {
      if (intervalRef.current == null) {
        intervalRef.current = setInterval(getProgress, time)
      }
    } else {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [getProgress, needsPoll, time])

  return state
}
