import React from 'react'
import { useLrcPlay } from '@/plugins/lyric'
import { useIsPlay, useStatusText } from '@/store/player/hook'
// import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'


export default ({ autoUpdate }: { autoUpdate: boolean }) => {
  const { text } = useLrcPlay(autoUpdate)
  const statusText = useStatusText()
  const isPlay = useIsPlay()
  // console.log('render status')

  const status = isPlay ? text : statusText

  return <Text numberOfLines={1} size={12}>{status}</Text>
}

// const styles = createStyle({
//   text: {
//     fontSize: 10,
//   },
// })
