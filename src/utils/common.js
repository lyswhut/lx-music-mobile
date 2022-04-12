import { hideLyric } from './lyricDesktop'
import { destroy as destroyPlayer, pause } from '@/plugins/player/utils'
import { exitApp as utilExitApp } from './utils'

let isDestroying = false
export const exitApp = () => {
  if (isDestroying) return
  isDestroying = true
  Promise.all([
    hideLyric(),
    pause(),
  ]).finally(destroyPlayer).finally(() => {
    isDestroying = false
    utilExitApp()
  })
}
