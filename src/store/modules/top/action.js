import music from '@/utils/music'

const cache = new Map()
const LIST_LOAD_LIMIT = 30

export const TYPES = {
  setBoardsList: null,
  setList: null,
  clearList: null,
  setListLoading: null,
  setListEnd: null,
}

for (const key of Object.keys(TYPES)) {
  TYPES[key] = `top__${key}`
}

export const getBoardsList = () => (dispatch, getState) => {
  const state = getState()
  let source = state.common.setting.leaderboard.source
  // let tabId = rootState.setting.leaderboard.tabId
  // let key = `${source}${tabId}${page}`
  // if (state.list.length && state.key == key) return true
  // commit('clearList')
  if (state.top.boards[source].length) return Promise.resolve()
  return music[source].leaderboard.getBoards().then(result => dispatch(setBoardsList({ boards: result, source })))
}

const getListLimit = ({ source, tabId, bangId, page }) => {
  const listKey = `${source}__${tabId}`
  const prevPageKey = `${source}__${tabId}__${page - 1}`
  const tempListKey = `${source}__${tabId}__temp`

  const listCache = cache.get(listKey)
  let sourcePage = 0
  if (listCache.has(prevPageKey)) {
    sourcePage = listCache.get(prevPageKey).sourcePage
  }
  return music[source].leaderboard.getList(bangId, sourcePage + 1).then(result => {
    let p = page
    if (listCache.has(tempListKey)) {
      const list = listCache.get(tempListKey)
      listCache.delete(tempListKey)
      listCache.set(`${source}__${tabId}__${p}`, {
        data: {
          ...result,
          list: [...list, ...result.list.splice(0, LIST_LOAD_LIMIT - list.length)],
          page: p,
          limit: LIST_LOAD_LIMIT,
        },
        sourcePage,
      })
      p++
    }
    sourcePage++
    do {
      if (result.list.length < LIST_LOAD_LIMIT && sourcePage < Math.ceil(result.total / result.limit)) {
        listCache.set(tempListKey, result.list.splice(0, LIST_LOAD_LIMIT))
        break
      }
      listCache.set(`${source}__${tabId}__${p}`, {
        data: {
          ...result,
          list: result.list.splice(0, LIST_LOAD_LIMIT),
          page: p,
          limit: LIST_LOAD_LIMIT,
        },
        sourcePage,
      })
      p++
    } while (result.list.length > 0)
    return listCache.get(`${source}__${tabId}__${page}`).data
  })
}

export const getList = ({ page, isRefresh = false }) => (dispatch, getState) => {
  const state = getState()
  let tabId = state.common.setting.leaderboard.tabId
  if (tabId == null) return Promise.resolve()
  // console.log(tabId)
  const [source, bangId] = tabId.split('__')
  const listKey = `${source}__${tabId}`
  const pageKey = `${source}__${tabId}__${page}`

  if (isRefresh && cache.has(listKey)) cache.delete(listKey)
  if (!cache.has(listKey)) cache.set(listKey, new Map())

  const listCache = cache.get(listKey)
  if (listCache.has(pageKey)) {
    return Promise.resolve(listCache.get(pageKey).data).then(result => dispatch(setList({ result, listKey, pageKey, page })))
  }

  dispatch(setListEnd(false))
  dispatch(setListLoading(true))
  return getListLimit({ source, tabId, bangId, page }).then(result => {
    dispatch(setList({ result, listKey, pageKey, page }))
    // listCache.set(pageKey, result)
  }).finally(() => {
    const state = getState().top
    if (state.listInfo.pageKey != pageKey) return
    dispatch(setListLoading(false))
  })
}

export const getListAll = tabId => (dispatch, getState) => {
  // console.log(tabId)
  const [source, bangId] = tabId.split('__')
  const listKey = `${source}__${tabId}`
  const listCache = cache.get(listKey)
  const loadData = (bangId, page) => {
    const pageKey = `${source}__${tabId}__${page}`
    return listCache.has(pageKey)
      ? Promise.resolve(listCache.get(pageKey))
      : music[source].leaderboard.getList(bangId, page).then(result => {
        listCache.set(pageKey, result)
        return result
      })
  }
  return loadData(bangId, 1).then(result => {
    if (result.total <= result.limit) return result.list

    let maxPage = Math.ceil(result.total / result.limit)
    const loadDetail = (loadPage = 1) => {
      return loadPage == maxPage
        ? loadData(bangId, ++loadPage).then(result => result.list)
        : loadData(bangId, ++loadPage).then(result1 => loadDetail(loadPage).then(result2 => [...result1.list, ...result2]))
    }
    return loadDetail().then(result2 => [...result.list, ...result2])
  })
}

export const setBoardsList = ({ boards, source }) => {
  return {
    type: TYPES.setBoardsList,
    payload: { boards, source },
  }
}
export const setList = ({ result, pageKey, listKey, page }) => {
  return {
    type: TYPES.setList,
    payload: { result, pageKey, listKey, page },
  }
}
export const clearList = () => {
  return { type: TYPES.clearList }
}
export const setListLoading = isLoading => {
  return {
    type: TYPES.setListLoading,
    payload: isLoading,
  }
}
export const setListEnd = isEnd => {
  return {
    type: TYPES.setListEnd,
    payload: isEnd,
  }
}
