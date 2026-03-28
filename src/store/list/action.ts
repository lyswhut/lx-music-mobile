import state, { type InitState } from './state'


export default {
  setUserLists(userList: LX.List.UserListInfo[]) {
    state.userList = userList
    state.allList = [state.defaultList, state.loveList, ...state.userList]

    global.state_event.mylistUpdated(state.allList)
  },
  setActiveList(activeListId: string) {
    state.activeListId = activeListId

    global.state_event.mylistToggled(activeListId)
  },
  setTempListMeta(meta: InitState['tempListMeta']) {
    state.tempListMeta = meta
  },
  setFetchingListStatus(id: string, status: boolean) {
    state.fetchingListStatus[id] = status

    global.state_event.fetchingListStatusUpdated({ ...state.fetchingListStatus })
  },
}


// Other code such as selectors can use the imported `RootState` type
// export const defaultList = (state: LX.State) => state.userList.defaultList
// export const loveList = (state: LX.State) => state.userList.loveList
// export const userList = (state: LX.State) => state.userList.userList
// export const selectAllList = createSelector(defaultList, loveList, userList, (defaultList, loveList, userList) => {
//   return [defaultList, loveList, ...userList]
// })

// export const selectActiveListId = (state: LX.State) => state.userList.activeListId

// export default slice.reducer
