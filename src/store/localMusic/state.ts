export interface InitState {
  /** 当前扫描结果 */
  musics: LX.Music.MusicInfoLocal[]
  /** 是否正在扫描 */
  isScanning: boolean
}

const state: InitState = {
  musics: [],
  isScanning: false,
}

export default state
