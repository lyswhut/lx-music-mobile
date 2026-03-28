import { collectMusic, dislikeMusic, pause, play, playNext, playPrev, togglePlay, uncollectMusic } from '@/core/player/player'

export type PlayerAction = 'play' | 'pause' | 'skipNext' | 'skipPrev' | 'togglePlay' | 'collect' | 'uncollect' | 'dislike'

export const handlePlayerAction = async(action: PlayerAction) => {
  switch (action) {
    case 'play':
      play()
      break
    case 'pause':
      void pause()
      break
    case 'skipNext':
      void playNext()
      break
    case 'skipPrev':
      void playPrev()
      break
    case 'togglePlay':
      togglePlay()
      break
    case 'collect':
      collectMusic()
      break
    case 'uncollect':
      uncollectMusic()
      break
    case 'dislike':
      void dislikeMusic()
      break
    // default: throw new Error('Unknown action: ' + (action as any ?? ''))
  }
}
