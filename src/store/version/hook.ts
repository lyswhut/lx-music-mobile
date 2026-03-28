import { useEffect, useState } from 'react'
import state from './state'

export const useVersionInfo = () => {
  const [info, setInfo] = useState(state.versionInfo)

  useEffect(() => {
    global.state_event.on('versionInfoUpdated', setInfo)
    return () => {
      global.state_event.off('versionInfoUpdated', setInfo)
    }
  }, [])

  return info
}

export const useVersionDownloadProgressUpdated = () => {
  const [status, setStatus] = useState(state.progress)

  useEffect(() => {
    global.state_event.on('versionDownloadProgressUpdated', setStatus)
    return () => {
      global.state_event.off('versionDownloadProgressUpdated', setStatus)
    }
  }, [])

  return status
}

export const useVersionInfoIgnoreVersionUpdated = () => {
  const [version, setVersion] = useState(state.ignoreVersion)

  useEffect(() => {
    global.state_event.on('versionInfoIgnoreVersionUpdated', setVersion)
    return () => {
      global.state_event.off('versionInfoIgnoreVersionUpdated', setVersion)
    }
  }, [])

  return version
}

// export const useActiveListId = () => {
//   const [id, setId] = useState(state.activeListId)

//   useEffect(() => {
//     global.state_event.on('mylistToggled', setId)
//     return () => {
//       global.state_event.off('mylistToggled', setId)
//     }
//   }, [])

//   return id
// }


// export const useMusicList = () => {
//   const [list, setList] = useState<LX.List.ListMusics>([])

//   useEffect(() => {
//     const handleToggle = (activeListId: string) => {
//       void getListMusics(activeListId).then(setList)
//     }
//     const handleChange = (ids: string[]) => {
//       if (!ids.includes(state.activeListId)) return
//       void getListMusics(state.activeListId).then(setList)
//     }
//     global.state_event.on('mylistToggled', handleToggle)
//     global.app_event.on('myListMusicUpdate', handleChange)

//     handleToggle(state.activeListId)

//     return () => {
//       global.state_event.off('mylistToggled', handleToggle)
//       global.app_event.off('myListMusicUpdate', handleChange)
//     }
//   }, [])

//   return list
// }
