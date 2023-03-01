import { dismissOverlay, onModalDismissed, showSyncModeModal } from '@/navigation'
import syncState from '@/store/sync/state'
import syncActions from '@/store/sync/action'

type RemoveListener = (() => void) | null
let removeEvent: RemoveListener

export const setSyncStatus = (status: LX.Sync.Status) => {
  syncActions.setStatus(status)
}

export const setSyncMessage = (message: LX.Sync.Status['message']) => {
  syncActions.setMessage(message)
}

export const setSyncModeComponentId = (id: string) => {
  syncActions.setSyncModeComponentId(id)
}

const closeSyncModeModal = () => {
  if (syncState.syncModeComponentId) {
    void dismissOverlay(syncState.syncModeComponentId)
    syncActions.setSyncModeComponentId('')
  }
}
export const selectSyncMode = async(serverName: string) => new Promise<LX.Sync.Mode>((resolve, reject) => {
  removeSyncModeEvent()
  syncActions.setServerNmae(serverName)
  showSyncModeModal()

  const removeListeners = () => {
    removeListener!()
    removeListener = null
    removeEvent = null
    global.app_event.off('selectSyncMode', handleSelectMode)
  }

  const handleSelectMode = (mode: LX.Sync.Mode) => {
    removeListeners()
    closeSyncModeModal()
    resolve(mode)
  }

  removeEvent = () => {
    removeListeners()
    reject(new Error('cancel'))
  }

  global.app_event.on('selectSyncMode', handleSelectMode)

  let removeListener: RemoveListener = onModalDismissed(syncState.syncModeComponentId, () => {
    syncActions.setSyncModeComponentId('')
    removeEvent?.()
  })
})

export const removeSyncModeEvent = () => {
  if (!removeEvent) return
  removeEvent()
  removeEvent = null
  closeSyncModeModal()
}
