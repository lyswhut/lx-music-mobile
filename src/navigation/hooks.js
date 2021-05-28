import { useEffect } from 'react'
import { Navigation } from 'react-native-navigation'

export const useNavigationCommandComplete = (callback = () => {}) => {
  useEffect(() => {
    // Register the listener to all events related to our component
    let commandCompletedListener = Navigation.events().registerCommandCompletedListener(({ commandId }) => {
      callback()
      if (!commandCompletedListener) return
      commandCompletedListener.remove()
      commandCompletedListener = null
    })
    return () => {
      // Make sure to unregister the listener during cleanup
      if (!commandCompletedListener) return
      commandCompletedListener.remove()
      commandCompletedListener = null
    }
  }, [callback])
}
export const useNavigationComponentDidAppear = (componentId, callback = () => {}) => {
  useEffect(() => {
    const listener = {
      componentDidAppear: () => {
        callback()
      },
    }
    // Register the listener to all events related to our component
    const unsubscribe = Navigation.events().registerComponentListener(listener, componentId)
    return () => {
      // Make sure to unregister the listener during cleanup
      unsubscribe.remove()
    }
  })
}
export const useNavigationComponentDidDisappear = (componentId, callback = () => {}) => {
  useEffect(() => {
    const listener = {
      componentDidDisappear: () => {
        callback()
      },
    }
    // Register the listener to all events related to our component
    const unsubscribe = Navigation.events().registerComponentListener(listener, componentId)
    return () => {
      // Make sure to unregister the listener during cleanup
      unsubscribe.remove()
    }
  })
}
