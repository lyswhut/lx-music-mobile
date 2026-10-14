import { forwardRef, useImperativeHandle, useRef } from 'react'
import { View } from 'react-native'

import { createStyle } from '@/utils/tools'
import { type Source } from '@/store/songlist/state'
import Tag, { type TagType, type TagProps } from './Tag'

export interface HeaderBarProps {
  onTagChange: TagProps['onTagChange']
}

export interface HeaderBarType {
  setSource: (source: Source, sortId: string, tagName: string, tagId: string) => void
}


export default forwardRef<HeaderBarType, HeaderBarProps>(({ onTagChange }, ref) => {
  const tagRef = useRef<TagType>(null)

  useImperativeHandle(ref, () => ({
    setSource(source, sortId, tagName, tagId) {
      tagRef.current?.setSelectedTagInfo(source, tagName, tagId)
    },
  }), [])


  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Tag ref={tagRef} onTagChange={onTagChange} />
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    zIndex: 2,
  },
  toolbar: {
    flexDirection: 'column',
    paddingLeft: 0,
    paddingRight: 0,
    height: 64,
  },
})