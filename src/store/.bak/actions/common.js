export const TYPES = {
  updateSetting: 'updateSetting',
  updateNavHomeViewPageIndex: 'updateNavHomeViewPageIndex',
}

export const updateSetting = setting => {
  return {
    type: TYPES.updateSetting,
    payload: setting,
  }
}

export const updateNavHomeViewPageIndex = index => ({
  type: TYPES.updateNavHomeViewPageIndex,
  payload: index,
})

// export const changeCountAsync = count => (dispatch, getState) => {
//   console.log(getState())
//   setTimeout(() => {
//     dispatch(changeCount(count))
//   }, 1000)
// }
