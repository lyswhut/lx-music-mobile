import music from '../../../utils/music'

export const TYPES = {
  loading: 'loading',
  setText: 'setText',
  addHistory: 'addHistory',
  setList: 'setList',
  setLists: 'setLists',
  clearList: 'clearList',
  removeHistory: 'removeHistory',
  clearHistory: 'clearHistory',
}

const sources = []
for (const source of music.sources) {
  const musicSearch = music[source.id].musicSearch
  if (!musicSearch) continue
  sources.push(source)
}

export const search = ({ text, page, limit }) => (dispatch, getState) => {
  dispatch({ type: TYPES.setText, payload: text })
  dispatch({ type: TYPES.addHistory, payload: text })

  const state = getState()

  if (state.common.setting.search.searchSource == 'all') {
    const task = []
    for (const source of sources) {
      if (source.id == 'all') continue
      dispatch({ type: TYPES.loading, payload: true })
      task.push(music[source.id].musicSearch.search(text, page).catch(error => {
        console.log(error)
        return {
          allPage: 1,
          limit: 30,
          list: [],
          source: source.id,
          total: 0,
        }
      }))
    }
    return Promise.all(task).then(results => dispatch({ type: TYPES.setLists, payload: { results, page } }))
      .finally(() => dispatch({ type: TYPES.loading, payload: false }))
  } else {
    dispatch({ type: TYPES.loading, payload: true })
    return (music[state.common.setting.search.searchSource]?.musicSearch.search(text, page, limit) ?? Promise.reject(new Error('source not found'))).catch(error => {
      console.log(error)
      return {
        allPage: 1,
        limit: 30,
        list: [],
        source: state.common.setting.search.searchSource,
        total: 0,
      }
    }).then(data => dispatch({ type: TYPES.setList, payload: { page, ...data } }))
      .finally(() => dispatch({ type: TYPES.loading, payload: false }))
  }
}

export const setText = text => ({ type: TYPES.setText, payload: text })

export const clearList = () => ({
  type: TYPES.clearList,
})
export const addHistory = text => ({
  type: TYPES.addHistory,
  payload: text,
})
export const removeHistory = index => ({
  type: TYPES.addHistory,
  payload: index,
})
export const clearHistory = () => ({
  type: TYPES.addHistory,
})
