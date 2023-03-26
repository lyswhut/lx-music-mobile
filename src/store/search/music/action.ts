import state, { type InitState, type ListInfo, type Source } from './state'
import { sortInsert, similar, arrPush } from '@/utils/common'
import { deduplicationList, toNewMusicInfo } from '@/utils'


export interface SearchResult {
  list: LX.Music.MusicInfoOnline[]
  allPage: number
  limit: number
  total: number
  source: LX.OnlineSource
}


/**
 * 按搜索关键词重新排序列表
 * @param list 歌曲列表
 * @param keyword 搜索关键词
 * @returns 排序后的列表
 */
const handleSortList = (list: LX.Music.MusicInfoOnline[], keyword: string) => {
  let arr: any[] = []
  for (const item of list) {
    sortInsert(arr, {
      num: similar(keyword, `${item.name} ${item.singer}`),
      data: item,
    })
  }
  return arr.map(item => item.data).reverse()
}


const setLists = (results: SearchResult[], page: number, text: string): LX.Music.MusicInfoOnline[] => {
  let pages = []
  let totals = []
  let limit = 0
  let list = [] as LX.Music.MusicInfoOnline[]
  for (const source of results) {
    state.maxPages[source.source] = source.allPage
    limit = Math.max(source.limit, limit)
    if (source.allPage < page) continue
    arrPush(list, source.list)
    pages.push(source.allPage)
    totals.push(source.total)
  }
  list = handleSortList(list.map(s => toNewMusicInfo(s) as LX.Music.MusicInfoOnline), text)
  let listInfo = state.listInfos.all
  listInfo.maxPage = Math.max(0, ...pages)
  const total = Math.max(0, ...totals)
  if (page == 1 || (total && list.length)) listInfo.total = total
  else listInfo.total = limit * page
  // listInfo.limit = limit
  listInfo.page = page
  listInfo.list = deduplicationList(page > 1 ? [...listInfo.list, ...list] : list)
  state.source = 'all'

  return listInfo.list
}

const setList = (datas: SearchResult, page: number, text: string): LX.Music.MusicInfoOnline[] => {
  // console.log(datas.source, datas.list)
  let listInfo = state.listInfos[datas.source] as ListInfo
  const list = datas.list.map(s => toNewMusicInfo(s) as LX.Music.MusicInfoOnline)
  listInfo.list = deduplicationList(page == 1 ? list : [...listInfo.list, ...list])
  if (page == 1 || (datas.total && datas.list.length)) listInfo.total = datas.total
  else listInfo.total = datas.limit * page
  listInfo.maxPage = datas.allPage
  listInfo.page = page
  listInfo.limit = datas.limit
  state.source = datas.source

  return listInfo.list
}

export default {
  setSource(source: InitState['source']) {
    state.source = source
  },
  setSearchText(searchText: InitState['searchText']) {
    state.searchText = searchText
  },
  setListInfo(result: SearchResult | SearchResult[], page: number, text: string) {
    if (Array.isArray(result)) {
      return setLists(result, page, text)
    } else {
      return setList(result, page, text)
    }
  },
  clearListInfo(sourceId: Source) {
    let listInfo = state.listInfos[sourceId] as ListInfo
    listInfo.list = []
    listInfo.page = 0
    listInfo.maxPage = 0
    listInfo.total = 0
  },
}
