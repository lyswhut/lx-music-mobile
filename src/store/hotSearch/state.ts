import musicSdk from '@/utils/musicSdk'

// import { deduplicationList } from '@common/utils/renderer'

export declare type Source = LX.OnlineSource | 'all'

type SourceLists = Partial<Record<Source, string[]>>


export interface InitState {
  sources: Source[]
  sourceList: SourceLists
}

const state: InitState = {
  sources: [],
  sourceList: {
    all: [],
  },
}

for (const source of musicSdk.sources) {
  if (!musicSdk[source.id as LX.OnlineSource]?.hotSearch) continue
  state.sources.push(source.id as LX.OnlineSource)
  state.sourceList[source.id as LX.OnlineSource] = []
}
state.sources.push('all')

export default state
