import leaderboardState, { type Board, type ListDetailInfo } from '@/store/leaderboard/state'
import leaderboardActions from '@/store/leaderboard/action'
import { deduplicationList, toNewMusicInfo } from '@/utils'
import musicSdk from '@/utils/musicSdk'

/**
 * 获取排行榜内单页歌曲
 * @param id 排行榜id  {souce}__{bangId}
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const setListDetailInfo = (id: string) => {
  clearListDetail()
  const [source, bangId] = id.split('__') as [LX.OnlineSource, string]
  leaderboardActions.setListDetailInfo(source, bangId)
}
export const setListDetail = (result: ListDetailInfo, id: string, page: number) => {
  return leaderboardActions.setListDetail(result, id, page)
}

export const clearListDetail = () => {
  leaderboardActions.clearListDetail()
}

const setBoard = (board: Board, source: LX.OnlineSource) => {
  leaderboardActions.setBoard(board, source)
}

interface PageCache { data: ListDetailInfo, sourcePage: number }
type CacheValue = Map<string, PageCache | ListDetailInfo['list']>

const cache = new Map<string, CacheValue>()
const LIST_LOAD_LIMIT = 30

export const getBoardsList = async(source: LX.OnlineSource) => {
  // const source = (await getLeaderboardSetting()).source as LX.OnlineSource
  if (leaderboardState.boards[source]) return leaderboardState.boards[source]!.list
  const board = await (musicSdk[source]?.leaderboard.getBoards() as Promise<Board>)
  setBoard(board, source)
  return leaderboardState.boards[source]!.list
}

/**
 * 获取排行榜内单页分页歌曲（用于在本地控制每页大小）
 * @param source 源
 * @param bangId 排行榜id
 * @param page 页数
 * @returns
 */
const getListLimit = async(source: LX.OnlineSource, bangId: string, page: number): Promise<ListDetailInfo> => {
  const listKey = `${source}__${bangId}`
  const prevPageKey = `${source}__${bangId}__${page - 1}`
  const tempListKey = `${source}__${bangId}__temp`

  let listCache = cache.get(listKey) as CacheValue
  if (!listCache) cache.set(listKey, listCache = new Map())
  let sourcePage = 0
  {
    const prevPageData = listCache.get(prevPageKey) as PageCache
    if (prevPageData) sourcePage = prevPageData.sourcePage
  }

  return musicSdk[source]?.leaderboard.getList(bangId, sourcePage + 1).then((result: ListDetailInfo) => {
    if (listCache !== cache.get(listKey)) return
    result.list = deduplicationList(result.list.map(m => toNewMusicInfo(m)) as LX.Music.MusicInfoOnline[])
    let p = page
    const tempList = listCache.get(tempListKey) as ListDetailInfo['list']
    if (tempList) {
      listCache.delete(tempListKey)
      listCache.set(`${source}__${bangId}__${p}`, {
        data: {
          ...result,
          list: [...tempList, ...result.list.splice(0, LIST_LOAD_LIMIT - tempList.length)],
          page: p,
          limit: LIST_LOAD_LIMIT,
        },
        sourcePage,
      })
      p++
    }
    sourcePage++
    do {
      if (result.list.length < LIST_LOAD_LIMIT && sourcePage < Math.ceil(result.total / result.limit)) {
        listCache.set(tempListKey, result.list.splice(0, LIST_LOAD_LIMIT))
        break
      }
      listCache.set(`${source}__${bangId}__${p}`, {
        data: {
          ...result,
          list: result.list.splice(0, LIST_LOAD_LIMIT),
          page: p,
          limit: LIST_LOAD_LIMIT,
        },
        sourcePage,
      })
      p++
    } while (result.list.length > 0)
    return (listCache.get(`${source}__${bangId}__${page}`) as PageCache).data
  }) ?? Promise.reject(new Error('source not found'))
}

/**
 * 获取排行榜内单页歌曲
 * @param id 排行榜id  {souce}__{bangId}
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const getListDetail = async(id: string, page: number, isRefresh = false): Promise<ListDetailInfo> => {
  // console.log(tabId)
  const [source, bangId] = id.split('__') as [LX.OnlineSource, string]
  const listKey = `${source}__${bangId}`
  const pageKey = `${source}__${bangId}__${page}`

  let listCache = cache.get(listKey)
  if (!listCache || isRefresh) {
    cache.set(listKey, listCache = new Map())
  }

  let pageCache = listCache.get(pageKey) as PageCache
  if (pageCache) return pageCache.data

  return getListLimit(source, bangId, page)
}

/**
 * 获取排行榜内全部歌曲
 * @param id 排行榜id  {souce}__{id}
 * @param isRefresh 是否跳过缓存
 * @returns
 */
export const getListDetailAll = async(id: string, isRefresh = false): Promise<LX.Music.MusicInfoOnline[]> => {
  const [source, bangId] = id.split('__') as [LX.OnlineSource, string]
  // console.log(tabId)
  const listKey = `${source}__${bangId}`
  let listCache = cache.get(listKey) as CacheValue
  if (!listCache || isRefresh) {
    cache.set(listKey, listCache = new Map())
  }

  const loadData = async(page: number): Promise<ListDetailInfo> => {
    const pageKey = `${source}__${bangId}__${page}`
    let pageCache = listCache.get(pageKey) as PageCache
    if (pageCache) return pageCache.data
    return getListLimit(source, bangId, page)
  }
  return loadData(1).then(async result => {
    if (result.total <= result.limit) return result.list

    let maxPage = Math.ceil(result.total / result.limit)
    const loadDetail = async(loadPage = 2): Promise<LX.Music.MusicInfoOnline[]> => {
      return loadPage == maxPage
        ? loadData(loadPage).then(result => result.list)
        // eslint-disable-next-line @typescript-eslint/promise-function-async
        : loadData(loadPage).then(result1 => loadDetail(++loadPage).then(result2 => [...result1.list, ...result2]))
    }
    return loadDetail().then(result2 => [...result.list, ...result2])
  }).then(list => deduplicationList(list))
}

/**
 * 获取并设置排行榜内单页歌曲
 * @param id 排行榜id  {souce}__{id}
 * @param isRefresh 是否跳过缓存
 * @returns
 */
// export const getAndSetListDetail = async(id: string, page: number, isRefresh = false) => {
//   // let [source, bangId] = tabId.split('__')
//   // if (!bangId) return
//   let key = `${id}__${page}`

//   if (!isRefresh && leaderboardState.listDetailInfo.key == key && leaderboardState.listDetailInfo.list.length) return

//   leaderboardState.listDetailInfo.key = key

//   return getListDetail(id, page, isRefresh).then((result: ListDetailInfo) => {
//     if (key != leaderboardState.listDetailInfo.key) return
//     setListDetail(result, id, page)
//   }).catch((error: any) => {
//     clearListDetail()
//     console.log(error)
//     throw error
//   })
// }
