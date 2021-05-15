import { createSelector } from 'reselect'


// sourceInfo(state, getters, rootState, { sourceNames }) {
//   return { sources: sources.map(item => ({ id: item.id, name: sourceNames[item.id] })), sortList }
// },
// tags: state => state.tags,
// isVisibleListDetail: state => state.isVisibleListDetail,
// selectListInfo: state => state.selectListInfo,
// listData(state) {
//   return state.list
// },
// listDetail(state) {
//   return state.listDetail
// },

export const defaultList = state => state.list.defaultList
export const loveList = state => state.list.loveList
export const userList = state => state.list.userList
export const isJumpPosition = state => state.list.isJumpPosition

export const allList = createSelector([defaultList, loveList, userList], (defaultList, loveList, userList) => {
  return [defaultList, loveList, ...userList]
})

