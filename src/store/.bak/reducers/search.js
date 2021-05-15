import { TYPES } from '../actions/search'

import music from '../../../utils/music'

let historyList
if (historyList == null) {
  historyList = []
  // electronStore_data.set('searchHistoryList', historyList)
}

const sources = []
const sourceList = {}
const sourceMaxPage = {}
for (const source of music.sources) {
  const musicSearch = music[source.id].musicSearch
  if (!musicSearch) continue
  sources.push(source)
  sourceList[source.id] = {
    page: 1,
    allPage: 0,
    limit: 30,
    total: 0,
    list: [],
  }
  sourceMaxPage[source.id] = 0
}

const initialState = {
  isLoading: false,
  sourceList,
  list: [],
  text: '',
  page: 1,
  limit: 30,
  allPage: 1,
  total: 0,
  sourceMaxPage,
  historyList,
}

sources.push({
  id: 'all',
  name: '聚合搜索',
})

// https://blog.csdn.net/xcxy2015/article/details/77164126#comments
const similar = (a, b) => {
  if (!a || !b) return 0
  if (a.length > b.length) { // 保证 a <= b
    const t = b
    b = a
    a = t
  }
  const al = a.length
  const bl = b.length
  const mp = [] // 一个表
  let i, j, ai, lt, tmp // ai：字符串a的第i个字符。 lt：左上角的值。 tmp：暂存新的值。
  for (i = 0; i <= bl; i++) mp[i] = i
  for (i = 1; i <= al; i++) {
    ai = a.charAt(i - 1)
    lt = mp[0]
    mp[0] = mp[0] + 1
    for (j = 1; j <= bl; j++) {
      tmp = Math.min(mp[j] + 1, mp[j - 1] + 1, lt + (ai == b.charAt(j - 1) ? 0 : 1))
      lt = mp[j]
      mp[j] = tmp
    }
  }
  return 1 - (mp[bl] / bl)
}

const sortInsert = (arr, data) => {
  const key = data.num
  let left = 0
  let right = arr.length - 1

  while (left <= right) {
    const middle = parseInt((left + right) / 2)
    if (key == arr[middle]) {
      left = middle
      break
    } else if (key < arr[middle].num) {
      right = middle - 1
    } else {
      left = middle + 1
    }
  }
  while (left > 0) {
    if (arr[left - 1].num != key) break
    left--
  }

  arr.splice(left, 0, data)
}

const handleSortList = (list, keyword) => {
  const arr = []
  for (const item of list) {
    sortInsert(arr, {
      num: similar(keyword, `${item.name} ${item.singer}`),
      data: item,
    })
  }
  return arr.map(item => item.data).reverse()
}

const filterList = list => {
  const set = new Set()
  for (let i = list.length - 1; i > -1; i--) {
    const item = list[i]
    if (set.has(item.songmid)) {
      list.splice(i, 1)
    } else {
      set.add(item.songmid)
    }
  }
  return list
}

const mutations = {
  [TYPES.loading](state, isLoading) {
    return {
      ...state,
      isLoading,
    }
  },
  [TYPES.setText](state, text) {
    return {
      ...state,
      text,
    }
  },
  [TYPES.addHistory](state, text) {
    let historyList = [...state.historyList]
    const index = historyList.indexOf(text)
    if (index > -1) historyList.splice(index, 1)
    if (historyList.length >= 15) historyList = historyList.slice(0, 14)
    historyList.unshift(text)
    return {
      ...state,
      historyList,
    }
  },
  [TYPES.setList](state, datas) {
    const source = { ...state.sourceList[datas.source] }
    source.list = datas.page > 1 ? filterList([...source.list, ...datas.list]) : datas.list
    source.total = datas.total
    source.allPage = datas.allPage
    source.page = datas.page
    source.limit = datas.limit

    return {
      ...state,
      sourceList: {
        ...state.sourceList,
        [datas.source]: source,
      },
    }
  },
  [TYPES.setLists](state, { results, page }) {
    const pages = []
    let total = 0
    let limit = 0
    const list = []
    state = { ...state }
    state.sourceMaxPage = { ...state.sourceMaxPage }
    for (const source of results) {
      sourceMaxPage[source.source] = source.allPage
      if (source.allPage < page) continue
      list.push(...source.list)
      pages.push(source.allPage)
      total += source.total
      limit += source.limit
    }
    state.allPage = Math.max(...pages)
    state.total = total
    state.limit = limit
    state.page = page
    state.list = page > 1 ? filterList([...state.list, ...handleSortList(list, state.text)]) : handleSortList(list, state.text)
    return state
  },
  [TYPES.clearList](state) {
    state = { ...state }
    state.sourceMaxPage = { ...state.sourceMaxPage }
    state.sourceList = { ...state.sourceList }
    for (const source of Object.keys(state.sourceList)) {
      state.sourceList[source] = { ...state.sourceList[source] }
      state.sourceList[source].list = []
      state.sourceList[source].page = 0
      state.sourceList[source].allPage = 0
      state.sourceList[source].total = 0
      state.sourceMaxPage[source] = 0
    }
    state.list = []
    state.page = 0
    state.allPage = 0
    state.total = 0
    state.text = ''
    return state
  },
  [TYPES.removeHistory](state, index) {
    const historyList = [...state.historyList]
    historyList.splice(index, 1)
    return {
      ...state,
      historyList,
    }
  },
  [TYPES.clearHistory](state) {
    return {
      ...state,
      historyList: [],
    }
  },
}

export default (state = initialState, action) =>
  mutations[action.type]
    ? mutations[action.type](state, action.payload)
    : state
