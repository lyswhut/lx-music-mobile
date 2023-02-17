import { httpFetch } from '../../request'
import musicSearch from './musicSearch'

export default {
  getText(url, tryNum = 0) {
    const requestObj = httpFetch(url, {
      headers: {
        Referer: 'https://app.c.nf.migu.cn/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
        channel: '0146921',
      },
    })
    return requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode == 200) return body
      if (tryNum > 5 || statusCode == 404) return Promise.reject('歌词获取失败')
      return this.getText(url, ++tryNum)
    })
  },
  getLrc(url) {
    return this.getText(url)
  },
  getTrc(url) {
    if (!url) return Promise.resolve('')
    return this.getText(url)
  },
  getMusicInfo(songInfo) {
    return songInfo.mrcUrl == null
      ? musicSearch.search(`${songInfo.name} ${songInfo.singer || ''}`.trim(), 1, { limit: 25 }).then(({ list }) => {
        const targetSong = list.find(s => s.songmid == songInfo.songmid)
        return targetSong ? { lrcUrl: targetSong.lrcUrl, mrcUrl: targetSong.mrcUrl, trcUrl: targetSong.trcUrl } : Promise.reject('获取歌词失败')
      })
      : Promise.resolve({ lrcUrl: songInfo.lrcUrl, mrcUrl: songInfo.mrcUrl, trcUrl: songInfo.trcUrl })
  },
  getLyric(songInfo, tryNum = 0) {
    // console.log(songInfo.copyrightId)
    if (songInfo.lrcUrl) {
      return {
        promise: this.getMusicInfo(songInfo).then(info => {
          return Promise.all([this.getLrc(info.lrcUrl), this.getTrc(info.trcUrl)]).then(([lyric, tlyric]) => {
            return {
              lyric,
              tlyric,
            }
          })
        }),
        cancelHttp() {},
      }
    } else {
      let requestObj = httpFetch(`http://music.migu.cn/v3/api/music/audioPlayer/getLyric?copyrightId=${songInfo.copyrightId}`, {
        headers: {
          Referer: 'http://music.migu.cn/v3/music/player/audio?from=migu',
        },
      })
      requestObj.promise = requestObj.promise.then(({ body }) => {
        if (body.returnCode !== '000000' || !body.lyric) {
          if (tryNum > 5) return Promise.reject(new Error('Get lyric failed'))
          let tryRequestObj = this.getLyric(songInfo, ++tryNum)
          requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
          return tryRequestObj.promise
        }
        return {
          lyric: body.lyric,
          tlyric: '',
        }
      })
      return requestObj
    }
  },
}
