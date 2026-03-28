import { type EmitterSubscription } from 'react-native'
import { Navigation } from 'react-native-navigation'


export const onModalDismissed = (id: string, handler: () => void) => {
  let modalDismissedListener: EmitterSubscription | null = Navigation.events().registerModalDismissedListener(({ componentId, modalsDismissed }) => {
    if (componentId != id || !modalDismissedListener) return
    handler()
    modalDismissedListener.remove()
    modalDismissedListener = null
  })
  return () => {
    if (!modalDismissedListener) return
    modalDismissedListener.remove()
    modalDismissedListener = null
  }
}
