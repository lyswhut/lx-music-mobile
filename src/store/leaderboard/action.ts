import state, { type Source, type Board, type ListDetailInfo } from './state'

export default {
  setBoard(board: Board, source: LX.OnlineSource) {
    state.boards[source] = board
  },
  setListDetailInfo(source: Source, id: string) {
    state.listDetailInfo.source = source
    state.listDetailInfo.id = id
  },
  setListDetail(result: ListDetailInfo, id: string, page: number) {
    state.listDetailInfo.list = page == 1 ? [...result.list] : [...state.listDetailInfo.list, ...result.list]
    state.listDetailInfo.id = id
    state.listDetailInfo.source = result.source
    state.listDetailInfo.total = result.total
    state.listDetailInfo.limit = result.limit
    state.listDetailInfo.page = page
    state.listDetailInfo.maxPage = Math.ceil(result.total / result.limit)

    return state.listDetailInfo
  },
  clearListDetail() {
    state.listDetailInfo.list = []
    state.listDetailInfo.id = ''
    state.listDetailInfo.source = null
    state.listDetailInfo.total = 0
    state.listDetailInfo.limit = 30
    state.listDetailInfo.page = 1
    state.listDetailInfo.maxPage = 1
    state.listDetailInfo.key = null
  },
}

