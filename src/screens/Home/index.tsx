import React, { useEffect } from 'react'
import { useDimensions } from '@/utils/hooks'
import PageContent from '@/components/PageContent'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import Vertical from './Vertical'
import Horizontal from './Horizontal'

interface Props {
  componentId: string
}


export default ({ componentId }: Props) => {
  const { window } = useDimensions()
  useEffect(() => {
    setComponentId(COMPONENT_IDS.home, componentId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PageContent>
      {
        window.height > window.width
          ? <Vertical />
          : <Horizontal />
      }
    </PageContent>
  )
}
