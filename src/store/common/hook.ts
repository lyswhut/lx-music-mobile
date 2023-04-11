import { type COMPONENT_IDS } from '@/config/constant'
import { useEffect, useState } from 'react'
import state, { type InitState } from './state'

export const useFontSize = () => {
  const [value, update] = useState(state.fontSize)

  useEffect(() => {
    global.state_event.on('fontSizeUpdated', update)
    return () => {
      global.state_event.off('fontSizeUpdated', update)
    }
  }, [])

  return value
}

export const useComponentIds = () => {
  const [value, update] = useState(state.componentIds)

  useEffect(() => {
    global.state_event.on('componentIdsUpdated', update)
    return () => {
      global.state_event.off('componentIdsUpdated', update)
    }
  }, [])

  return value
}

const hasVisible = (visibleNames: COMPONENT_IDS[], ids: InitState['componentIds']) => {
  const names = Object.keys(ids)
  return names.length == visibleNames.length ? visibleNames.every(n => names.includes(n)) : false
}
export const usePageVisible = (visibleNames: COMPONENT_IDS[], onChange: (visible: boolean) => void) => {
  useEffect(() => {
    let visible = hasVisible(visibleNames, state.componentIds)
    const handlecheck = (ids: InitState['componentIds']) => {
      const res = hasVisible(visibleNames, ids)
      // console.log(visible, res, res == visible)
      if (res == visible) return
      visible = res
      onChange(visible)
    }
    global.state_event.on('componentIdsUpdated', handlecheck)
    return () => {
      global.state_event.off('componentIdsUpdated', handlecheck)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}


export const useAssertApiSupport = (source: LX.Source) => {
  const [value, update] = useState(global.lx.qualityList[source] != null || source == 'local')

  useEffect(() => {
    const handleUpdate = () => {
      update(global.lx.qualityList[source] != null || source == 'local')
    }

    global.state_event.on('apiSourceUpdated', handleUpdate)
    return () => {
      global.state_event.off('apiSourceUpdated', handleUpdate)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return value
}


export const useNavActiveId = () => {
  const [value, update] = useState(state.navActiveId)

  useEffect(() => {
    global.state_event.on('navActiveIdUpdated', update)
    return () => {
      global.state_event.off('navActiveIdUpdated', update)
    }
  }, [])

  return value
}


export const useSourceNames = () => {
  const [value, update] = useState(state.sourceNames)

  useEffect(() => {
    global.state_event.on('sourceNamesUpdated', update)
    return () => {
      global.state_event.off('sourceNamesUpdated', update)
    }
  }, [])

  return value
}

