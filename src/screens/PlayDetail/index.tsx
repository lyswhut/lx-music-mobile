import React, { useEffect } from 'react'
// import { View, StyleSheet } from 'react-native'
import { useDimensions } from '@/utils/hooks'

import Vertical from './Vertical'
import Horizontal from './Horizontal'
import PageContent from '@/components/PageContent'
import StatusBar from '@/components/common/StatusBar'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'

export default ({ componentId }: { componentId: string }) => {
  const { window } = useDimensions()

  useEffect(() => {
    setComponentId(COMPONENT_IDS.playDetail, componentId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PageContent>
      <StatusBar />
      {
        window.height > window.width
          ? <Vertical componentId={componentId} />
          : <Horizontal componentId={componentId} />
      }
    </PageContent>
  )
}
