import { useState, useEffect } from 'react'
import state, { type InitState } from './state'

export const useLocalMusics = (): LX.Music.MusicInfoLocal[] => {
  const [musics, setMusics] = useState(state.musics)

  useEffect(() => {
    const handler = (m: LX.Music.MusicInfoLocal[]) => setMusics(m)
    global.state_event.on('localMusicsUpdated', handler)
    return () => { global.state_event.off('localMusicsUpdated', handler) }
  }, [])

  return musics
}

export const useIsScanning = (): boolean => {
  const [isScanning, setIsScanning] = useState(state.isScanning)

  useEffect(() => {
    const handler = (s: boolean) => setIsScanning(s)
    global.state_event.on('localMusicScanningUpdated', handler)
    return () => { global.state_event.off('localMusicScanningUpdated', handler) }
  }, [])

  return isScanning
}
