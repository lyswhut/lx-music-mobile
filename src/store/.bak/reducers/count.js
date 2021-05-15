import { TYPES } from '../actions/counts'

const initialState = {
  count: 0,
}

const countReducer = (state = initialState, action) => {
  switch (action.type) {
    case TYPES.COUNTER_CHANGE:
      return {
        ...state,
        count: action.payload,
      }
    default:
      return state
  }
}

export default countReducer
