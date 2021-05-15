import { TYPES } from './action'
import music from '@/utils/music'
const sourceList = {}
const sources = []
for (const source of music.sources) {
  const leaderboard = music[source.id].leaderboard
  if (!leaderboard || !leaderboard.getBoards) continue
  sourceList[source.id] = []
  sources.push(source)
}

// state
const initialState = {
  sources,
  boards: sourceList,
  listInfo: {
    list: [],
    total: 0,
    page: 1,
    limit: 30,
    listKey: null,
    pageKey: null,
  },
  isLoading: false,
  isEnd: false,
}

const mutations = {
  [TYPES.setBoardsList](state, { boards, source }) {
    return {
      ...state,
      boards: { ...state.boards, [source]: boards.list },
    }
  },
  [TYPES.clearList](state) {
    return {
      ...state,
      listInfo: {
        ...state.listInfo,
        list: [],
        total: 0,
        page: 1,
        pageKey: null,
        listKey: null,
      },
      isLoading: false,
      isEnd: false,
    }
  },
  [TYPES.setList](state, { result, pageKey, listKey, page }) {
    return {
      ...state,
      listInfo: {
        ...state.listInfo,
        list: listKey == state.listInfo.listKey && page != 1 ? [...state.listInfo.list, ...result.list] : result.list,
        total: result.total,
        limit: result.limit,
        page,
        pageKey,
        listKey,
      },
      isEnd: page >= Math.ceil(result.total / result.limit),
    }
  },
  [TYPES.setListLoading](state, isLoading) {
    return {
      ...state,
      isLoading,
    }
  },
  [TYPES.setListEnd](state, isEnd) {
    return {
      ...state,
      isEnd,
    }
  },
}

export default (state = initialState, action) => mutations[action.type]
  ? mutations[action.type](state, action.payload)
  : state

