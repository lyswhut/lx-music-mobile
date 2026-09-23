import { sortInsert, similar } from '@/utils/common'

import type { InitState, ListInfoItem, Source } from './state'
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
  const pages: number[] = []
  for (const source of results) {
    list.push(...source.list)
    totals.push(source.total)
    maxTotals[source.source] = source.total
    const sourcePages = Math.ceil(source.total / source.limit)
    state.maxPages[source.source] = sourcePages
    pages.push(sourcePages)
    limit = Math.max(source.limit, limit)
  }
  // 聚合搜索的"到底了"要看所有源里最靠后的那一页。以前只写各子源的 maxPages，
  // state.source 是 'all' 时读到 undefined，判定永远不成立——滚到底之后每滑一次
  // 都会再发一轮必定为空的请求。
  state.maxPages.all = Math.max(0, ...pages)

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
  let listInfo = state.listInfos[datas.source]!
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
    let listInfo = state.listInfos[sourceId]!
    listInfo.page = 1
    listInfo.limit = 20
    listInfo.total = 0
    listInfo.list = []
    listInfo.key = null
    listInfo.tagId = ''
    listInfo.sortId = ''
  },
}
