import { TYPES } from './action'
import music from '@/utils/music'
import { deduplicationList } from '@/utils/tools'
const sortList = {}
const sources = []
for (const source of music.sources) {
  const songList = music[source.id].songList
  if (!songList) continue
  sortList[source.id] = songList.sortList
  sources.push(source)
}
// state
const initialState = {
  sources,
  sortList,
  tags: {},
  list: {
    list: [],
    total: 0,
    page: 1,
    limit: 30,
    listKey: null,
    pageKey: null,
    isLoading: false,
    isEnd: false,
  },
  listDetail: {
    list: [],
    desc: null,
    total: 0,
    page: 1,
    limit: 30,
    info: {},
    listKey: null,
    pageKey: null,
    isLoading: false,
    isEnd: false,
  },
  selectListInfo: {},
  isVisibleListDetail: false,
  isGetListDetailFailed: false,
}

sources.forEach(source => {
  initialState.tags[source.id] = null
})

const mutations = {
  [TYPES.setTags](state, { tags, source }) {
    return {
      ...state,
      tags: { ...state.tags, [source]: tags },
    }
  },
  [TYPES.clearList](state) {
    return {
      ...state,
      list: {
        ...state.list,
        list: [],
        total: 0,
        page: 1,
        pageKey: null,
        listKey: null,
        isLoading: false,
        isEnd: false,
      },
    }
  },
  [TYPES.setList](state, { result, pageKey, listKey, page }) {
    if (pageKey == state.list.pageKey && state.list.list.length) return state
    return {
      ...state,
      list: {
        ...state.list,
        list: listKey == state.list.listKey && page != 1 ? [...state.list.list, ...result.list] : result.list,
        total: result.total,
        limit: result.limit,
        page,
        pageKey,
        listKey,
        isEnd: page >= Math.ceil(result.total / result.limit),
      },
    }
  },
  [TYPES.setListDetail](state, { result, pageKey, listKey, source, id, page }) {
    return {
      ...state,
      listDetail: {
        ...state.listDetail,
        list: deduplicationList(listKey == state.listDetail.listKey && page != 1 ? [...state.listDetail.list, ...result.list] : result.list),
        id,
        source,
        total: result.total,
        limit: result.limit,
        page,
        pageKey,
        listKey,
        isEnd: page >= Math.ceil(result.total / result.limit),
        info: result.info || {
          name: state.selectListInfo.name,
          img: state.selectListInfo.img,
          desc: state.selectListInfo.desc,
          author: state.selectListInfo.author,
          play_count: state.selectListInfo.play_count,
        },
      },
    }
  },
  [TYPES.setVisibleListDetail](state, bool) {
    const newState = {
      ...state,
      isVisibleListDetail: bool,
    }
    if (!bool) newState.listDetail = { ...newState.listDetail, list: [] }
    return newState
  },
  [TYPES.setSelectListInfo](state, info) {
    return {
      ...state,
      selectListInfo: info,
    }
  },
  [TYPES.clearListDetail](state) {
    return {
      ...state,
      listDetail: {
        ...state.listDetail,
        id: null,
        source: null,
        list: [],
        desc: null,
        total: 0,
        page: 1,
        limit: 30,
        pageKey: null,
        listKey: null,
        isLoading: false,
        isEnd: false,
        info: {},
      },
    }
  },
  [TYPES.setGetListDetailFailed](state, isFailed) {
    return {
      ...state,
      isGetListDetailFailed: isFailed,
    }
  },
  [TYPES.setListLoading](state, isLoading) {
    return {
      ...state,
      list: {
        ...state.list,
        isLoading,
      },
    }
  },
  [TYPES.setListDetailLoading](state, isLoading) {
    return {
      ...state,
      listDetail: {
        ...state.listDetail,
        isLoading,
      },
    }
  },
  [TYPES.setListEnd](state, isEnd) {
    return {
      ...state,
      list: {
        ...state.list,
        isEnd,
      },
    }
  },
  [TYPES.setListDetailEnd](state, isEnd) {
    return {
      ...state,
      listDetail: {
        ...state.listDetail,
        isEnd,
      },
    }
  },
}

export default (state = initialState, action) => mutations[action.type]
  ? mutations[action.type](state, action.payload)
  : state

