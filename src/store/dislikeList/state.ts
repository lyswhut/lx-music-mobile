
interface InitState {
  dislikeInfo: LX.Dislike.DislikeInfo
}
const state: InitState = {
  dislikeInfo: {
    names: new Set(),
    musicNames: new Set(),
    singerNames: new Set(),
    rules: '',
  },
}


export {
  state,
}


