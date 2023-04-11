import { sortInsert, similar } from '@/utils/common'

import type { InitState, ListInfoItem, SearchListInfo, Source } from './state'
import state from './state'

export interface SearchResult {
  list: ListInfoItem[]
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
const handleSortList = (list: ListInfoItem[], keyword: string) => {
  let arr: any[] = []
  for (const item of list) {
    sortInsert(arr, {
      num: similar(keyword, item.name),
      data: item,
    })
  }
  return arr.map(item => item.data).reverse()
}


let maxTotals: Partial<Record<LX.OnlineSource, number>> = {

}
const setLists = (results: SearchResult[], page: number, text: string): ListInfoItem[] => {
  let totals = []
  let limit = 0
  let list = []
  for (const source of results) {
    list.push(...source.list)
    totals.push(source.total)
    maxTotals[source.source] = source.total
    state.maxPages[source.source] = Math.ceil(source.total / source.limit)
    limit = Math.max(source.limit, limit)
  }

  let listInfo = state.listInfos.all
  const total = Math.max(0, ...totals)
  if (page == 1 || (total && list.length)) listInfo.total = total
  else listInfo.total = limit * page
  listInfo.page = page
  list = handleSortList(list, text)
  listInfo.list = page > 1 ? [...listInfo.list, ...list] : list
  state.source = 'all'
  return listInfo.list
}

const setList = (datas: SearchResult, page: number, text: string): ListInfoItem[] => {
  // console.log(datas.source, datas.list)
  let listInfo = state.listInfos[datas.source] as SearchListInfo
  listInfo.list = page == 1 ? datas.list : [...listInfo.list, ...datas.list]
  if (page == 1 || (datas.total && datas.list.length)) listInfo.total = datas.total
  else listInfo.total = datas.limit * page
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
    let listInfo = state.listInfos[sourceId] as SearchListInfo
    listInfo.page = 1
    listInfo.limit = 20
    listInfo.total = 0
    listInfo.list = []
    listInfo.key = null
    listInfo.tagId = ''
    listInfo.sortId = ''
  },
}
