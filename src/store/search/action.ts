import state, { type InitState } from './state'
// let isInitedSearchHistory = false
// const saveSearchHistoryListThrottle = throttle((list: LX.List.SearchHistoryList) => {
//   saveSearchHistoryList(list)
// }, 500)


// export const getHistoryList = async() => {
//   if (isInitedSearchHistory) return
//   historyList.push(...(await getSearchHistoryList() ?? []))
//   isInitedSearchHistory = true
// }
// export const addHistoryWord = async(word: string) => {
//   if (!appSetting['search.isShowHistorySearch']) return
//   if (!isInitedSearchHistory) await getHistoryList()
//   let index = historyList.indexOf(word)
//   if (index > -1) historyList.splice(index, 1)
//   if (historyList.length >= 15) historyList.splice(14, historyList.length - 14)
//   historyList.unshift(word)
//   saveSearchHistoryListThrottle(toRaw(historyList))
// }
// export const removeHistoryWord = (index: number) => {
//   historyList.splice(index, 1)
//   saveSearchHistoryListThrottle(toRaw(historyList))
// }
// export const clearHistoryList = (id: string) => {
//   historyList.splice(0, historyList.length)
//   saveSearchHistoryList([])
// }


export default {
  setSearchType(type: InitState['searchType']) {
    state.searchType = type
  },
  setSearchText(text: string) {
    state.searchText = text
  },
  setTipListInfo(keyword: InitState['tipListInfo']['text'], source: InitState['tipListInfo']['source']) {
    state.tipListInfo.text = keyword
    state.tipListInfo.source = source
  },
  setTipList(list: InitState['tipListInfo']['list']) {
    state.tipListInfo.list = list
  },
  setHistoryWord(list: string[]) {
    state.historyList = list
  },
  addHistoryWord(word: string) {
    let index = state.historyList.indexOf(word)
    if (index == 0) return
    if (index > -1) state.historyList.splice(index, 1)
    if (state.historyList.length >= 15) state.historyList.splice(14, state.historyList.length - 14)
    state.historyList.unshift(word)
    return [...state.historyList]
  },
  removeHistoryWord(index: number) {
    state.historyList.splice(index, 1)
    return [...state.historyList]
  },
  clearHistoryList() {
    state.historyList = []
    return state.historyList
  },
}
