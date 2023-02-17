import React from 'react'
import Btn from './Btn'
import { useComponentIds } from '@/store/common/hook'
import { navigations } from '@/navigation'


export default () => {
  const componentIds = useComponentIds()

  const handleShowCommentScreen = () => {
    navigations.pushCommentScreen(componentIds.playDetail as string)
  }

  return <Btn icon="comment" onPress={handleShowCommentScreen} />
}
