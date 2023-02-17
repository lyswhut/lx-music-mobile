import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

// import TagPopup, { type TagPopupProps, type TagPopupType } from './TagPopup'
import CurrentTagBtn, { type CurrentTagBtnType } from './CurrentTagBtn'
import { type Source } from '@/store/songlist/state'


export interface TagProps {
  onTagChange: (name: string, id: string) => void
}

export interface TagType {
  setSelectedTagInfo: (source: Source, name: string, activeId: string) => void
}

export default forwardRef<TagType, TagProps>(({ onTagChange }, ref) => {
  // console.log('render tag btn')
  const currentTagBtnRef = useRef<CurrentTagBtnType>(null)
  // const tagPopupRef = useRef<TagPopupType>(null)
  const tagInfoRef = useRef<{ source: Source, activeId: string }>({ source: 'kw', activeId: '' })

  useEffect(() => {
    const handleChange = (name: string, id: string) => {
      onTagChange(name, id)
      tagInfoRef.current.activeId = id
      currentTagBtnRef.current?.setCurrentTagInfo(name)
    }

    global.app_event.on('songlistTagInfoChange', handleChange)
    return () => {
      global.app_event.off('songlistTagInfoChange', handleChange)
    }
  }, [onTagChange])

  useImperativeHandle(ref, () => ({
    setSelectedTagInfo(source, name, activeId) {
      tagInfoRef.current.activeId = activeId
      tagInfoRef.current.source = source
      currentTagBtnRef.current?.setCurrentTagInfo(name)
    },
  }))

  const handleShowList = () => {
    global.app_event.showSonglistTagList(tagInfoRef.current.source, tagInfoRef.current.activeId)
  }

  // const handleChangeTag: TagProps['onTagChange'] = (name, id) => {
  //   tagInfoRef.current.activeId = id
  //   onTagChange(name, id)
  //   currentTagBtnRef.current?.setCurrentTagInfo(name)
  // }

  return <CurrentTagBtn ref={currentTagBtnRef} onShowList={handleShowList} />
})
