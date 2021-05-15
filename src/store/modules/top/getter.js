import { createSelector } from 'reselect'


// sourceInfo(state, getters, rootState, { sourceNames }) {
//   return { sources: sources.map(item => ({ id: item.id, name: sourceNames[item.id] })), sortList }
// },
// tags: state => state.tags,
// isVisibleListDetail: state => state.isVisibleListDetail,

export const rawSources = state => state.top.sources

export const boards = state => state.top.boards

export const listInfo = state => state.top.listInfo
export const isEnd = state => state.top.isEnd
export const isLoading = state => state.top.isLoading

export const sourceId = state => state.common.setting.leaderboard.source
export const tabId = state => state.common.setting.leaderboard.tabId

export const sources = createSelector([rawSources], sources => {
  return sources.map(source => ({ label: source.name, id: source.id }))
})

