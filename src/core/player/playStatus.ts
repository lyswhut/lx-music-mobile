import playerActions from '@/store/player/action'
import playerState from '@/store/player/state'


export const setIsPlay = (val: boolean) => {
  if (playerState.isPlay == val) return
  playerActions.setIsPlay(val)
}


export const setStatusText = (val: string) => {
  if (playerState.statusText == val) return
  playerActions.setStatusText(val)
}
