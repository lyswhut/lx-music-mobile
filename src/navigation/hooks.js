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
  }, [callback, componentId])
}

export const onNavigationComponentDidDisappearEvent = (componentId, callback = () => {}) => {
  const listener = {
    componentDidDisappear: () => {
      callback()
    },
  }
  const unsubscribe = Navigation.events().registerComponentListener(listener, componentId)
  return unsubscribe
}

export const useNavigationComponentDidDisappear = (componentId, callback = () => {}) => {
  useEffect(() => {
    const unsubscribe = onNavigationComponentDidDisappearEvent(componentId, callback)
    return () => {
      // Make sure to unregister the listener during cleanup
      unsubscribe.remove()
    }
  }, [callback, componentId])
}
