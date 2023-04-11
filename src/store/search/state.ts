export type SearchType = 'music' | 'songlist'

export interface InitState {
  temp_source: 'kw'
  // temp_source: LX.OnlineSource
  searchType: SearchType
  searchText: string
  tipListInfo: {
    text: string
    source: 'kw'
    list: string[]
  }
  historyList: string[]
}

const state: InitState = {
  temp_source: 'kw',
  searchType: 'music',
  searchText: '',
  tipListInfo: {
    text: '',
    source: 'kw',
    list: [],
  },
  historyList: [],
}


export default state
