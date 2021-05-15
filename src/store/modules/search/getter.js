import { createSelector } from 'reselect'


export const text = state => state.search.text
export const sourceList = state => state.search.sourceList
export const aggregationListInfo = state => state.search.aggregationListInfo
export const isEnd = state => state.search.isEnd
export const isLoading = state => state.search.isLoading

export const tipList = state => state.search.tipInfo.list
export const tipListVisible = state => state.search.tipInfo.visible


export const rawSources = state => state.search.sources
export const tempSearchSource = state => state.common.setting.search.tempSearchSource
export const searchSource = state => state.common.setting.search.searchSource


export const sources = createSelector([rawSources], sources => {
  return sources.map(source => ({ label: source.name, id: source.id }))
})


export const currentSourceName = createSelector([rawSources, searchSource], (sources, searchSource) => {
  const source = sources.find(s => s.id == searchSource)
  return source ? source.name : 'unknown'
})

export const listInfo = createSelector([searchSource, sourceList, aggregationListInfo], (searchSource, sourceList, aggregationListInfo) => {
  return searchSource == 'all'
    ? aggregationListInfo
    : sourceList[searchSource]
})
