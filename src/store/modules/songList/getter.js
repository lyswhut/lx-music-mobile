import { createSelector } from 'reselect'


// sourceInfo(state, getters, rootState, { sourceNames }) {
//   return { sources: sources.map(item => ({ id: item.id, name: sourceNames[item.id] })), sortList }
// },
// tags: state => state.tags,
// isVisibleListDetail: state => state.isVisibleListDetail,

export const rawSources = state => state.songList.sources

export const sortList = state => state.songList.sortList

export const tags = state => state.songList.tags

export const isVisibleListDetail = state => state.songList.isVisibleListDetail
export const isGetListDetailFailed = state => state.songList.isGetListDetailFailed
export const selectListInfo = state => state.songList.selectListInfo
export const listData = state => state.songList.list
export const listDetailData = state => state.songList.listDetail

export const listInfo = state => state.songList.list
export const listDetailInfo = state => state.songList.listDetail

export const songListSource = state => state.common.setting.songList.source
export const songListSortId = state => state.common.setting.songList.sortId
export const songListTagInfo = state => state.common.setting.songList.tagInfo

export const sources = createSelector([rawSources], sources => {
  return sources.map(source => ({ label: source.name, id: source.id }))
})

