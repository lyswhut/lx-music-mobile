import music from '@/utils/musicSdk'

export declare type Source = LX.OnlineSource

export declare interface BoardItem {
  id: string
  name: string
  bangid: string
}
export declare interface Board {
  list: BoardItem[]
  source: LX.OnlineSource
}
type Boards = Partial<Record<LX.OnlineSource, Board>>

export declare interface ListDetailInfo {
  list: LX.Music.MusicInfoOnline[]
  total: number
  maxPage: number
  page: number
  source: LX.OnlineSource | null
  limit: number
  key: string | null
  id: string
}

export interface InitState {
  sources: LX.OnlineSource[]
  boards: Boards
  listDetailInfo: ListDetailInfo
}

const state: InitState = {
  sources: [],
  boards: {},
  listDetailInfo: {
    list: [],
    total: 0,
    page: 1,
    maxPage: 1,
    limit: 30,
    key: null,
    source: null,
    id: '',
  },
}

for (const source of music.sources) {
  if (!music[source.id as LX.OnlineSource]?.leaderboard?.getBoards) continue
  state.sources.push(source.id as LX.OnlineSource)
}


export default state
