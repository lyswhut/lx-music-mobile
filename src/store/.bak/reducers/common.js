import { initSetting } from '../../../config'
import { TYPES } from '../actions/common'

const initialState = {
  ...initSetting(),
  nav: {
    homeViewPageIndex: 0,
  },
}

const mutations = {
  [TYPES.updateSetting](state, setting) {
    return {
      ...state,
      setting: {
        ...setting,
      },
    }
  },
  [TYPES.updateNavHomeViewPageIndex](state, index) {
    return {
      ...state,
      nav: {
        ...state.nav,
        homeViewPageIndex: index,
      },
    }
  },
}

export default (state = initialState, action) =>
  mutations[action.type]
    ? mutations[action.type](state, action.payload)
    : state
