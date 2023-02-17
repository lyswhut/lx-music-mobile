import state, { type InitState } from './state'
import { type COMPONENT_IDS } from '@/config/constant'


export default {
  setFontSize(size: number) {
    state.fontSize = size
    global.state_event.fontSizeUpdated(size)
  },
  setComponentId(name: COMPONENT_IDS, id: string) {
    state.componentIds[name] = id
    global.state_event.componentIdsUpdated({ ...state.componentIds })
  },
  removeComponentId(id: string) {
    const name = (Object.entries(state.componentIds) as Array<[COMPONENT_IDS, string]>).find(kv => kv[1] == id)?.[0]
    if (!name) return
    delete state.componentIds[name]
    global.state_event.componentIdsUpdated({ ...state.componentIds })
  },
  setNavActiveId(id: InitState['navActiveId']) {
    state.navActiveId = id
    global.state_event.navActiveIdUpdated(id)
  },
  setSourceNames(names: InitState['sourceNames']) {
    state.sourceNames = names
    global.state_event.sourceNamesUpdated(names)
  },
}

