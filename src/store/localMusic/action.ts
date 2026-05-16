import state, { type InitState } from './state'

export default {
  setLocalMusics(musics: LX.Music.MusicInfoLocal[]) {
    state.musics = musics
    global.state_event.localMusicsUpdated([...state.musics])
  },

  setScanning(isScanning: boolean) {
    state.isScanning = isScanning
    global.state_event.localMusicScanningUpdated(isScanning)
  },
}
