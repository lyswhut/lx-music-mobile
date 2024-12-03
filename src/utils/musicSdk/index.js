import kw from './kw'
import kg from './kg'
import tx from './tx'
import wy from './wy'
import mg from './mg'
// import bd from './bd'
import xm from './xm'
import { supportQuality } from './api-source'


const sources = {
  sources: [
    {
      name: '酷我音乐',
      id: 'kw',
    },
    {
      name: '酷狗音乐',
      id: 'kg',
    },
    {
      name: 'QQ音乐',
      id: 'tx',
    },
    {
      name: '网易音乐',
      id: 'wy',
    },
    {
      name: '咪咕音乐',
      id: 'mg',
    },
    // {
    //   name: '百度音乐',
    //   id: 'bd',
    // },
  ],
  kw,
  kg,
  tx,
  wy,
  mg,
  // bd,
  xm,
}
export default {
  ...sources,
  supportQuality,
}

export const init = () => {
  const tasks = []
  for (let source of sources.sources) {
    let sm = sources[source.id]
    sm && sm.init && tasks.push(sm.init())
  }
  return Promise.all(tasks)
}


export const searchMusic = async({ name, singer, source: s, limit = 25 }) => {
  const trimStr = str => typeof str == 'string' ? str.trim() : str
  const musicName = trimStr(name)
  const tasks = []
  const excludeSource = ['xm']
  for (const source of sources.sources) {
    if (!sources[source.id].musicSearch || source.id == s || excludeSource.includes(source.id)) continue
    tasks.push(sources[source.id].musicSearch.search(`${musicName} ${singer || ''}`.trim(), 1, limit).catch(_ => null))
  }
  return (await Promise.all(tasks)).filter(s => s)
}

export const findMusic = async(musicInfo) => {
  const { name, singer, albumName, interval, source: s } = musicInfo

  const lists = await searchMusic({ name, singer, source: s, limit: 25 })

  const singersRxp = /、|&|;|；|\/|,|，|\|/
  const sortSingle = singer => singersRxp.test(singer)
    ? singer.split(singersRxp).sort((a, b) => a.localeCompare(b)).join('、')
    : (singer || '')
  const sortMusic = (arr, callback) => {
    const tempResult = []
    for (let i = arr.length - 1; i > -1; i--) {
      const item = arr[i]
      if (callback(item)) {
        delete item.fSinger
        delete item.fMusicName
        delete item.fAlbumName
        delete item.fInterval
        tempResult.push(item)
        arr.splice(i, 1)
      }
    }
    tempResult.reverse()
    return tempResult
  }
  const getIntv = (interval) => {
    if (!interval) return 0
    // if (musicInfo._interval) return musicInfo._interval
    let intvArr = interval.split(':')
    let intv = 0
    let unit = 1
    while (intvArr.length) {
      intv += parseInt(intvArr.pop()) * unit
      unit *= 60
    }
    return intv
  }
  const trimStr = str => typeof str == 'string' ? str.trim() : (str || '')
  const filterStr = str => typeof str == 'string' ? str.replace(/\s|'|\.|,|，|&|"|、|\(|\)|（|）|`|~|-|<|>|\||\/|\]|\[|!|！/g, '') : String(str || '')
  const fMusicName = filterStr(name).toLowerCase()
  const fSinger = filterStr(sortSingle(singer)).toLowerCase()
  const fAlbumName = filterStr(albumName).toLowerCase()
  const fInterval = getIntv(interval)
  const isEqualsInterval = (intv) => Math.abs((fInterval || intv) - (intv || fInterval)) < 5
  const isIncludesName = (name) => (fMusicName.includes(name) || name.includes(fMusicName))
  const isIncludesSinger = (singer) => fSinger ? (fSinger.includes(singer) || singer.includes(fSinger)) : true
  const isEqualsAlbum = (album) => fAlbumName ? fAlbumName == album : true

  const result = lists.map(source => {
    for (const item of source.list) {
      item.name = trimStr(item.name)
      item.singer = trimStr(item.singer)
      item.fSinger = filterStr(sortSingle(item.singer).toLowerCase())
      item.fMusicName = filterStr(String(item.name ?? '').toLowerCase())
      item.fAlbumName = filterStr(String(item.albumName ?? '').toLowerCase())
      item.fInterval = getIntv(item.interval)
      // console.log(fMusicName, item.fMusicName, item.source)
      if (!isEqualsInterval(item.fInterval)) {
        item.name = null
        continue
      }
      if (item.fMusicName == fMusicName && isIncludesSinger(item.fSinger)) return item
    }
    for (const item of source.list) {
      if (item.name == null) continue
      if (item.fSinger == fSinger && isIncludesName(item.fMusicName)) return item
    }
    for (const item of source.list) {
      if (item.name == null) continue
      if (isEqualsAlbum(item.fAlbumName) && isIncludesSinger(item.fSinger) && isIncludesName(item.fMusicName)) return item
    }
    return null
  }).filter(s => s)
  const newResult = []
  if (result.length) {
    newResult.push(...sortMusic(result, item => item.fSinger == fSinger && item.fMusicName == fMusicName && item.interval == interval))
    newResult.push(...sortMusic(result, item => item.fMusicName == fMusicName && item.fSinger == fSinger && item.fAlbumName == fAlbumName))
    newResult.push(...sortMusic(result, item => item.fSinger == fSinger && item.fMusicName == fMusicName))
    newResult.push(...sortMusic(result, item => item.fMusicName == fMusicName && item.interval == interval))
    newResult.push(...sortMusic(result, item => item.fSinger == fSinger && item.interval == interval))
    newResult.push(...sortMusic(result, item => item.interval == interval))
    newResult.push(...sortMusic(result, item => item.fMusicName == fMusicName))
    newResult.push(...sortMusic(result, item => item.fSinger == fSinger))
    newResult.push(...sortMusic(result, item => item.fAlbumName == fAlbumName))
    for (const item of result) {
      delete item.fSinger
      delete item.fMusicName
      delete item.fAlbumName
      delete item.fInterval
    }
    newResult.push(...result)
  }
  // console.log(newResult)
  return newResult
}
