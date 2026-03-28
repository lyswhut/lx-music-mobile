import music from '@/utils/musicSdk'

export declare interface ListInfo {
  list: LX.Music.MusicInfoOnline[]
  total: number
  page: number
  maxPage: number
  limit: number
  key: string | null
}

interface ListInfos extends Partial<Record<LX.OnlineSource, ListInfo>> {
  'all': ListInfo
}

export type Source = LX.OnlineSource | 'all'

export interface InitState {
  searchText: string
  source: Source
  sources: Source[]
  listInfos: ListInfos
  maxPages: Partial<Record<LX.OnlineSource, number>>
}

const state: InitState = {
  searchText: '',
  source: 'kw',
  sources: [],
  listInfos: {
    all: {
      page: 1,
      maxPage: 0,
      limit: 30,
      total: 0,
      list: [],
      key: null,
    },
  },
  maxPages: {},
}

for (const source of music.sources) {
  if (!music[source.id as LX.OnlineSource]?.musicSearch) continue
  state.sources.push(source.id as LX.OnlineSource)
  state.listInfos[source.id as LX.OnlineSource] = {
    page: 1,
    maxPage: 0,
    limit: 30,
    total: 0,
    list: [],
    key: '',
  }
  state.maxPages[source.id as LX.OnlineSource] = 0
}
state.sources.push('all')

export default state
