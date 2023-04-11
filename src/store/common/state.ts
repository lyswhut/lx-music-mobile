import { type NAV_ID_Type, type COMPONENT_IDS } from '@/config/constant'


export interface InitState {
  fontSize: number
  componentIds: Partial<Record<COMPONENT_IDS, string>>
  navActiveId: NAV_ID_Type
  sourceNames: Record<LX.OnlineSource | 'all', string>
}

const initData = {}

const state: InitState = {
  fontSize: global.lx.fontSize,
  componentIds: {},
  navActiveId: 'nav_search',
  sourceNames: initData as InitState['sourceNames'],
}


export default state
