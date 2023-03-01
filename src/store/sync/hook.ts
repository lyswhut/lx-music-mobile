import { useEffect, useState } from 'react'
import state from './state'

export const useStatus = () => {
  const [value, update] = useState(state.status)

  useEffect(() => {
    global.state_event.on('syncStatusUpdated', update)
    return () => {
      global.state_event.off('syncStatusUpdated', update)
    }
  }, [])

  return value
}
