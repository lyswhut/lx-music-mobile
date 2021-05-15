// import { httpFetch } from '../../utils/request'

export const TYPES = {
  COUNTER_CHANGE: 'COUNTER_CHANGE',
}

export const changeCount = count => {
  return {
    type: TYPES.COUNTER_CHANGE,
    payload: count,
  }
}

export const changeCountAsync = count => (dispatch, getState) => {
  // console.log(getState())
  // const { promise } = httpFetch('https://cdn.stsky.cn/lx-music/desktop/version.json')
  // promise.then(resp => {
  //   console.log(resp)
  // })
  setTimeout(() => {
    dispatch(changeCount(count))
  }, 1000)
}
