import hotSearchState, { type Source } from '@/store/hotSearch/state'
import hotSearchActions, { type Lists } from '@/store/hotSearch/action'
import musicSdk from '@/utils/musicSdk'

export const getList = async(source: Source): Promise<string[]> => {
  if (source == 'all') {
    let task = []
    for (const source of hotSearchState.sources) {
      if (source == 'all') continue
      task.push(
        hotSearchState.sourceList[source]?.length
          ? Promise.resolve({ source, list: hotSearchState.sourceList[source] as Lists[number]['list'] })
          : ((musicSdk[source]?.hotSearch.getList() as Promise<Lists[number]>) ?? Promise.reject(new Error('source not found: ' + source))).catch((err: any) => {
              console.log(err)
              return { source, list: [] }
            }),
      )
    }
    return Promise.all(task).then((results: Lists) => {
      return hotSearchActions.setList(source, results)
    })
  } else {
    if (hotSearchState.sourceList[source]?.length) return hotSearchState.sourceList[source] as string[]
    if (!musicSdk[source]?.hotSearch) {
      hotSearchActions.setList(source, [])
      return []
    }
    return musicSdk[source]?.hotSearch.getList().catch((err: any) => {
      console.log(err)
      return { source, list: [] }
    }).then(data => hotSearchActions.setList(source, data.list))
  }
}


