import music from '@/utils/music'

const cache = new Map()

const LIST_LOAD_LIMIT = 30

export const TYPES = {
  setTags: null,
  setList: null,
  clearList: null,
  setListDetail: null,
  setVisibleListDetail: null,
  setSelectListInfo: null,
  setListLoading: null,
  setListDetailLoading: null,
  setListEnd: null,
  setListDetailEnd: null,
  setGetListDetailFailed: null,
  clearListDetail: null,
}

for (const key of Object.keys(TYPES)) {
  TYPES[key] = `list__${key}`
}

export const getTags = () => (dispatch, getState) => {
  const state = getState()
  let source = state.common.setting.songList.source
  if (state.songList.tags[source]) return Promise.resolve()
  return music[source].songList.getTags().then(result => dispatch(setTags({ tags: result, source })))
}
export const getList = ({ page = 1, isRefresh = false }) => (dispatch, getState) => {
  const allState = getState()
  const rootState = allState.common
  let source = rootState.setting.songList.source
  let tabId = rootState.setting.songList.tagInfo.id
  let sortId = rootState.setting.songList.sortId

  let listKey = `slist__${source}__${sortId}__${tabId}`
  let pageKey = `slist__${source}__${sortId}__${tabId}__${page}`

  if (isRefresh && cache.has(listKey)) cache.delete(listKey)
  if (!cache.has(listKey)) cache.set(listKey, new Map())

  const listCache = cache.get(listKey)
  if (listCache.has(pageKey)) return Promise.resolve(listCache.get(pageKey)).then(result => dispatch(setList({ result, pageKey, listKey, page })))

  dispatch(setListEnd(false))
  dispatch(setListLoading(true))
  return music[source]?.songList.getList(sortId, tabId, page).then(result => {
    dispatch(setList({ result, pageKey, listKey, page }))
    listCache.set(pageKey, result)
  }).finally(() => {
    const state = getState().songList
    if (state.list.pageKey != pageKey) return
    dispatch(setListLoading(false))
  })
}

const getListDetailLimit = ({ source, id, page }) => {
  const listKey = `sdetail__${source}__${id}`
  const prevPageKey = `sdetail__${source}__${id}__${page - 1}`
  const tempListKey = `sdetail__${source}__${id}__temp`

  const listCache = cache.get(listKey)
  let sourcePage = 0
  if (listCache.has(prevPageKey)) {
    sourcePage = listCache.get(prevPageKey).sourcePage
  }
  return music[source]?.songList.getListDetail(id, sourcePage + 1).then(result => {
    let p = page
    if (listCache.has(tempListKey)) {
      const list = listCache.get(tempListKey)
      listCache.delete(tempListKey)
      listCache.set(`sdetail__${source}__${id}__${p}`, {
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
      listCache.set(`sdetail__${source}__${id}__${p}`, {
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
    return listCache.get(`sdetail__${source}__${id}__${page}`).data
  })
}

export const getListDetail = ({ id, page, isRefresh = false }) => (dispatch, getState) => {
  const allState = getState()
  const rootState = allState.common
  let source = rootState.setting.songList.source
  let listKey = `sdetail__${source}__${id}`
  let pageKey = `sdetail__${source}__${id}__${page}`

  if (isRefresh && cache.has(listKey)) cache.delete(listKey)
  if (!cache.has(listKey)) cache.set(listKey, new Map())

  dispatch(setGetListDetailFailed(false))
  const listCache = cache.get(listKey)
  if (listCache.has(pageKey)) {
    return Promise.resolve(listCache.get(pageKey).data).then(result => dispatch(setListDetail({ result, listKey, pageKey, source, id, page })))
  }

  dispatch(setListDetailEnd(false))
  dispatch(setListDetailLoading(true))
  return getListDetailLimit({ source, id, page }).then(result => {
    dispatch(setListDetail({ result, listKey, pageKey, source, id, page }))
    // listCache.set(pageKey, result)
  }).catch(err => {
    console.log(err)
    if (page == 1) {
      dispatch(setGetListDetailFailed(true))
    }
    return Promise.reject(err)
  }).finally(() => {
    const state = getState().songList
    if (state.listDetail.pageKey != pageKey) return
    dispatch(setListDetailLoading(false))
  })
}

export const getListDetailAll = ({ source, id, isRefresh = false }) => (dispatch, getState) => {
  let listKey = `sdetail__${source}__${id}`
  if (isRefresh && cache.has(listKey)) cache.delete(listKey)
  if (!cache.has(listKey)) cache.set(listKey, new Map())
  const listCache = cache.get(listKey)
  const loadData = (id, page) => {
    let pageKey = `sdetail__${source}__${id}__${page}`
    return listCache.has(pageKey)
      ? Promise.resolve(listCache.get(pageKey).data)
      : getListDetailLimit({ source, id, page }).then(result => {
        // listCache.set(pageKey, result)
        return result
      })
  }
  return loadData(id, 1).then(result => {
    if (result.total <= result.limit) return result.list

    let maxPage = Math.ceil(result.total / result.limit)
    const loadDetail = (loadPage = 2) => {
      return loadPage == maxPage
        ? loadData(id, loadPage).then(result => result.list)
        : loadData(id, loadPage).then(result1 => loadDetail(++loadPage).then(result2 => [...result1.list, ...result2]))
    }
    return loadDetail().then(result2 => [...result.list, ...result2])
  })
}

export const setVisibleListDetail = isShow => {
  return {
    type: TYPES.setVisibleListDetail,
    payload: isShow,
  }
}
export const setSelectListInfo = info => (dispatch, getState) => {
  dispatch({
    type: TYPES.setSelectListInfo,
    payload: info,
  })
  dispatch({
    type: TYPES.clearListDetail,
  })
}
export const setGetListDetailFailed = isFailed => {
  return {
    type: TYPES.setGetListDetailFailed,
    payload: isFailed,
  }
}
export const setTags = ({ tags, source }) => {
  return {
    type: TYPES.setTags,
    payload: { tags, source },
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
export const setListDetailLoading = isLoading => {
  return {
    type: TYPES.setListDetailLoading,
    payload: isLoading,
  }
}
export const setListEnd = isEnd => {
  return {
    type: TYPES.setListEnd,
    payload: isEnd,
  }
}
export const setListDetailEnd = isEnd => {
  return {
    type: TYPES.setListDetailEnd,
    payload: isEnd,
  }
}

export const setListDetail = ({ result, pageKey, listKey, source, id, page }) => {
  return {
    type: TYPES.setListDetail,
    payload: { result, pageKey, listKey, source, id, page },
  }
}
