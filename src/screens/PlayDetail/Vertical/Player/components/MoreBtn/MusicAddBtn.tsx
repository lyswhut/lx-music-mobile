import React, { useRef } from 'react'
import MusicAddModal, { type MusicAddModalType } from '@/components/MusicAddModal'
import playerState from '@/store/player/state'
import Btn from './Btn'


export default () => {
  const musicAddModalRef = useRef<MusicAddModalType>(null)

  const handleShowMusicAddModal = () => {
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (!musicInfo) return
    musicAddModalRef.current?.show({
      musicInfo: 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo,
      isMove: false,
      listId: playerState.playMusicInfo.listId as string,
    })
  }

  return (
    <>
      <Btn icon="add-music" onPress={handleShowMusicAddModal} />
      <MusicAddModal ref={musicAddModalRef} />
    </>
  )
}
