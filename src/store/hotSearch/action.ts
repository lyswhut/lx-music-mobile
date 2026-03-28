import state, { type Source } from './state'

export type Lists = Array<{ source: LX.OnlineSource, list: string[] }>

const setList = (source: LX.OnlineSource, list: string[]): string[] => {
  const l = state.sourceList[source] = list.slice(0, 20)
  return l
}

const setLists = (lists: Lists): string[] => {
  let wordsMap = new Map<string, number>()
  for (const { source, list } of lists) {
    if (!state.sourceList[source]?.length) state.sourceList[source] = list.slice(0, 20)
    for (let item of list) {
      item = item.trim()
      wordsMap.set(item, (wordsMap.get(item) ?? 0) + 1)
    }
  }
  const wordsMapArr = Array.from(wordsMap)
  wordsMapArr.sort((a, b) => a[0].localeCompare(b[0]))
  wordsMapArr.sort((a, b) => b[1] - a[1])
  const words = wordsMapArr.map(item => item[0])
  return state.sourceList.all = words.slice(0, state.sources.length * 10)
}


export default {
  setList(source: Source, list: string[] | Lists) {
    if (source == 'all') {
      return setLists(list as Lists)
    }
    return setList(source, list as string[])
  },
  clearList(source: Source) {
    state.sourceList[source] = []
  },
}
