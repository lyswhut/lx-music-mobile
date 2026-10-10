import { useEffect, useState, useRef } from 'react'

import TrackPlayer from './trackPlayer'
import { State, Event } from './interfaces'

/** Get current playback state and subsequent updatates  */
export const usePlaybackState = () => {
  const [state, setState] = useState(State.None)
  const isUnmountedRef = useRef(true)

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  useEffect(() => {
    async function setPlayerState() {
      const playerState = await TrackPlayer.getState()

      // If the component has been unmounted, exit
      if (isUnmountedRef.current) return

      setState(playerState)
    }

    // Set initial state
    setPlayerState()

    const sub = TrackPlayer.addEventListener(Event.PlaybackState, data => {
      setState(data.state)
    })

    return () => sub.remove()
  }, [])

  return state
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (payload: { type: Event; [key: string]: any }) => void

/**
 * Attaches a handler to the given TrackPlayer events and performs cleanup on unmount
 * @param events - TrackPlayer events to subscribe to
 * @param handler - callback invoked when the event fires
 */
export const useTrackPlayerEvents = (events: Event[], handler: Handler) => {
  const savedHandler = useRef<Handler>()

  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    if (__DEV__) {
      const allowedTypes = Object.values(Event)
      const invalidTypes = events.filter(type => !allowedTypes.includes(type))
      if (invalidTypes.length) {
        console.warn(
          'One or more of the events provided to useTrackPlayerEvents is ' +
            `not a valid TrackPlayer event: ${invalidTypes.join("', '")}. ` +
            'A list of available events can be found at ' +
            'https://react-native-kit.github.io/react-native-track-player/documentation/#events',
        )
      }
    }

    const subs = events.map(event =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      TrackPlayer.addEventListener(event, payload => savedHandler.current!({ ...payload, type: event })),
    )

    return () => subs.forEach(sub => sub.remove())
  }, [events])
}

export interface ProgressState {
  position: number
  duration: number
  buffered: number
}

/**
 * Poll for track progress for the given interval (in miliseconds)
 * @param interval - ms interval
 */
export function useProgress(updateInterval?: number) {
  const [state, setState] = useState<ProgressState>({ position: 0, duration: 0, buffered: 0 })
  const playerState = usePlaybackState()
  const stateRef = useRef(state)
  const isUnmountedRef = useRef(true)
  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  const getProgress = async () => {
    const [position, duration, buffered] = await Promise.all([
      TrackPlayer.getPosition(),
      TrackPlayer.getDuration(),
      TrackPlayer.getBufferedPosition(),
    ])

    // If the component has been unmounted, exit
    if (isUnmountedRef.current) return

    // If there is no change in properties, exit
    if (
      position === stateRef.current.position &&
      duration === stateRef.current.duration &&
      buffered === stateRef.current.buffered
    )
      return

    const state = { position, duration, buffered }
    stateRef.current = state
    setState(state)
  }

  useEffect(() => {
    if (playerState === State.None) {
      setState({ position: 0, duration: 0, buffered: 0 })
      return
    }

    // Set initial state
    getProgress()

    // Create interval to update state periodically
    const poll = setInterval(getProgress, updateInterval || 1000)
    return () => clearInterval(poll)
  }, [playerState, updateInterval])

  return state
}
