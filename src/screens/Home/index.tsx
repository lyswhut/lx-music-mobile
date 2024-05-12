import { useEffect } from 'react'
import { useHorizontalMode } from '@/utils/hooks'
import PageContent from '@/components/PageContent'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import Vertical from './Vertical'
import Horizontal from './Horizontal'
import { navigations } from '@/navigation'
import settingState from '@/store/setting/state'


interface Props {
  componentId: string
}


export default ({ componentId }: Props) => {
  const isHorizontalMode = useHorizontalMode()
  useEffect(() => {
    setComponentId(COMPONENT_IDS.home, componentId)
    // eslint-disable-next-line react-hooks/exhaustive-deps

    if (settingState.setting['player.startupPushPlayDetailScreen']) {
      navigations.pushPlayDetailScreen(componentId, true)
    }
  }, [])

  return (
    <PageContent>
      {
        isHorizontalMode
          ? <Horizontal />
          : <Vertical />
      }
    </PageContent>
  )
}
