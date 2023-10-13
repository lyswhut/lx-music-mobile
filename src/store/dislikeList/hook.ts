import { useEffect, useState } from 'react'
import { state } from './state'
import { event } from './event'


export const useRuleNum = () => {
  const [num, setNum] = useState(state.dislikeInfo.musicNames.size + state.dislikeInfo.singerNames.size + state.dislikeInfo.names.size)

  useEffect(() => {
    const handleUpdate = () => {
      setNum(state.dislikeInfo.musicNames.size + state.dislikeInfo.singerNames.size + state.dislikeInfo.names.size)
    }
    event.on('dislike_changed', handleUpdate)
    return () => {
      event.off('dislike_changed', handleUpdate)
    }
  }, [])

  return num
}

