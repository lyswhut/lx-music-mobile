import { arrShuffle } from '@/utils'

const getIntv = (musicInfo: LX.Music.MusicInfo) => {
  if (!musicInfo.interval) return 0
  // if (musicInfo._interval) return musicInfo._interval
  let intvArr = musicInfo.interval.split(':')
  let intv = 0
  let unit = 1
  while (intvArr.length) {
    intv += parseInt(intvArr.pop()!) * unit
    unit *= 60
  }
  return intv
}

/**
 * 排序歌曲
 * @param list 歌曲列表
 * @param sortType 排序类型
 * @param fieldName 排序字段
 * @param localeId 排序语言
 * @returns
 */
export const sortListMusicInfo = (list: LX.Music.MusicInfo[], sortType: 'up' | 'down' | 'random', fieldName: 'name' | 'singer' | 'album' | 'time' | 'source', localeId: string) => {
  // console.log(sortType, fieldName, localeId)
  localeId = localeId.replaceAll('_', '-')
  switch (sortType) {
    case 'random':
      arrShuffle(list)
      break
    case 'up':
      if (fieldName == 'time') {
        list.sort((a, b) => {
          if (a.interval == null) {
            return b.interval == null ? 0 : -1
          } else return b.interval == null ? 1 : getIntv(a) - getIntv(b)
        })
      } else {
        switch (fieldName) {
          case 'name':
          case 'singer':
          case 'source':
            list.sort((a, b) => {
              if (a[fieldName] == null) {
                return b[fieldName] == null ? 0 : -1
              } else return b[fieldName] == null ? 1 : a[fieldName].localeCompare(b[fieldName], localeId)
            })
            break
          case 'album':
            list.sort((a, b) => {
              if (a.meta.albumName == null) {
                return b.meta.albumName == null ? 0 : -1
              } else return b.meta.albumName == null ? 1 : a.meta.albumName.localeCompare(b.meta.albumName, localeId)
            })
            break
        }
      }
      break
    case 'down':
      if (fieldName == 'time') {
        list.sort((a, b) => {
          if (a.interval == null) {
            return b.interval == null ? 0 : 1
          } else return b.interval == null ? -1 : getIntv(b) - getIntv(a)
        })
      } else {
        switch (fieldName) {
          case 'name':
          case 'singer':
          case 'source':
            list.sort((a, b) => {
              if (a[fieldName] == null) {
                return b[fieldName] == null ? 0 : 1
              } else return b[fieldName] == null ? -1 : b[fieldName].localeCompare(a[fieldName], localeId)
            })
            break
          case 'album':
            list.sort((a, b) => {
              if (a.meta.albumName == null) {
                return b.meta.albumName == null ? 0 : 1
              } else return b.meta.albumName == null ? -1 : b.meta.albumName.localeCompare(a.meta.albumName, localeId)
            })
            break
        }
      }
      break
  }
  return list
}


const variantRxp = /(\(|（).+(\)|）)/g
const variantRxp2 = /\s|'|\.|,|，|&|"|、|\(|\)|（|）|`|~|-|<|>|\||\/|\]|\[/g
export interface DuplicateMusicItem {
  id: string
  index: number
  group: string
  musicInfo: LX.Music.MusicInfo
}
/**
 * 过滤列表内重复的歌曲
 * @param list 歌曲列表
 * @param isFilterVariant 是否过滤 Live Explicit 等歌曲名
 * @returns
 */
export const filterDuplicateMusic = async(list: LX.Music.MusicInfo[], isFilterVariant: boolean = true) => {
  const listMap = new Map<string, DuplicateMusicItem[]>()
  const duplicateList = new Set<string>()
  const handleFilter = (name: string, index: number, musicInfo: LX.Music.MusicInfo) => {
    if (listMap.has(name)) {
      const targetMusicInfo = listMap.get(name)
      targetMusicInfo!.push({
        id: musicInfo.id,
        index,
        musicInfo,
        group: name,
      })
      duplicateList.add(name)
    } else {
      listMap.set(name, [{
        id: musicInfo.id,
        index,
        musicInfo,
        group: name,
      }])
    }
  }
  if (isFilterVariant) {
    list.forEach((musicInfo, index) => {
      let musicInfoName = musicInfo.name.toLowerCase().replace(variantRxp, '').replace(variantRxp2, '')
      musicInfoName ||= musicInfo.name.toLowerCase().replace(/\s+/g, '')
      handleFilter(musicInfoName, index, musicInfo)
    })
  } else {
    list.forEach((musicInfo, index) => {
      const musicInfoName = musicInfo.name.toLowerCase().trim()
      handleFilter(musicInfoName, index, musicInfo)
    })
  }
  // console.log(duplicateList)
  const duplicateNames = Array.from(duplicateList)
  duplicateNames.sort((a, b) => a.localeCompare(b))
  return duplicateNames.map(name => listMap.get(name)!).flat()
}
