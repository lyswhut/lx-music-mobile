import music from '@/utils/musicSdk'

export declare interface SortInfo {
  name: string
  tid: 'recommend' | 'hot' | 'new' | 'hot_collect' | 'rise'
  id: string
}

export declare interface TagInfoItem<T extends LX.OnlineSource = LX.OnlineSource> {
  parent_id: string
  parent_name: string
  id: string
  name: string
  source: T
}
export declare interface TagInfoTypeItem<T extends LX.OnlineSource = LX.OnlineSource> {
  name: string
  list: Array<TagInfoItem<T>>
}
export declare interface TagInfo<Source extends LX.OnlineSource = LX.OnlineSource> {
  tags: Array<TagInfoTypeItem<Source>>
  hotTag: Array<TagInfoItem<Source>>
  source: Source
}

type Tags = Partial<Record<LX.OnlineSource, TagInfo>>

export declare interface ListInfoItem {
  play_count?: string
  id: string
  author: string
  name: string
  time?: string
  img?: string
  // grade: basic.favorcnt / 10,
  desc?: string
  source: LX.OnlineSource
  total?: string
}
export declare interface ListInfo {
  list: ListInfoItem[]
  total: number
  page: number
  limit: number
  maxPage: number
  key: string | null
  source: LX.OnlineSource
  tagId: string
  sortId: string
}

export declare interface ListDetailInfo {
  list: LX.Music.MusicInfoOnline[]
  source: LX.OnlineSource
  desc: string | null
  total: number
  page: number
  limit: number
  maxPage: number
  key: string | null
  id: string
  info: {
    name?: string
    img?: string
    desc?: string
    author?: string
    play_count?: string
  }
}

// export const openSongListInputInfo = markRaw({
//   text: '',
//   source: '',
// })

export type Source = LX.OnlineSource
export interface InitState {
  sources: Source[]
  sortList: Partial<Record<Source, SortInfo[]>>
  tags: Tags
  listInfo: ListInfo
  selectListInfo: ListInfoItem
  listDetailInfo: ListDetailInfo
}


const state: InitState = {
  sources: [],
  sortList: {},
  tags: {},
  listInfo: {
    list: [],
    total: 0,
    page: 1,
    limit: 30,
    maxPage: 1,
    key: null,
    source: 'kw',
    tagId: '',
    sortId: '',
  },
  selectListInfo: {
    play_count: '',
    id: '',
    author: '',
    name: '',
    time: '',
    img: '',
    // grade: basic.favorcnt / 10,
    desc: '',
    source: 'kw',
  },
  listDetailInfo: {
    list: [],
    id: '',
    desc: null,
    total: 0,
    page: 1,
    limit: 30,
    maxPage: 1,
    key: null,
    source: 'kw',
    info: {},
  },
}


for (const source of music.sources) {
  const songList = music[source.id as Source]?.songList
  if (!songList) continue
  state.sources.push(source.id as Source)
  state.sortList[source.id as Source] = songList.sortList as SortInfo[]
}


export default state

