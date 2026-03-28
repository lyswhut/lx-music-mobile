import { type NAV_ID_Type, type COMPONENT_IDS } from '@/config/constant'


export interface InitState {
  fontSize: number
  statusbarHeight: number
  componentIds: Partial<Record<COMPONENT_IDS, string>>
  navActiveId: NAV_ID_Type
  lastNavActiveId: NAV_ID_Type
  sourceNames: Record<LX.OnlineSource | 'all', string>
  bgPic: string | null
}

const initData = {}

const state: InitState = {
  fontSize: global.lx.fontSize,
  statusbarHeight: 0,
  componentIds: {},
  navActiveId: 'nav_search',
  lastNavActiveId: 'nav_search',
  sourceNames: initData as InitState['sourceNames'],
  bgPic: null,
}


export default state
