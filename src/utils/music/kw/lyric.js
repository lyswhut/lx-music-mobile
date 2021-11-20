import { httpFetch } from '../../request'
import { decodeName } from '../../index'

export default {
  formatTime(time) {
    let m = parseInt(time / 60)
    let s = (time % 60).toFixed(2)
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
  },
  sortLrcArr(arr) {
    const lrcSet = new Set()
    let lrc = []
    let lrcT = []

    for (const item of arr) {
      if (lrcSet.has(item.time)) {
        lrc.push(item)
      } else {
        lrcT.push(item)
        lrcSet.add(item.time)
      }
    }
    if (lrc.length) {
      lrc.unshift(lrcT.shift())
    } else {
      lrc = lrcT
      lrcT = []
    }

    return {
      lrc,
      lrcT,
    }
  },
  transformLrc(songinfo, lrclist) {
    return `[ti:${songinfo.songName}]\n[ar:${songinfo.artist}]\n[al:${songinfo.album}]\n[by:]\n[offset:0]\n${lrclist ? lrclist.map(l => `[${this.formatTime(l.time)}]${l.lineLyric}\n`).join('') : '暂无歌词'}`
  },
  getLyric(songId) {
    const requestObj = httpFetch(`http://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=${songId}`)
    requestObj.promise = requestObj.promise.then(({ body }) => {
      // console.log(body)
      if (!body.data?.lrclist?.length) return Promise.reject(new Error('Get lyric failed'))
      const { lrc, lrcT } = this.sortLrcArr(body.data.lrclist)
      // console.log(body.data.lrclist)
      // console.log(lrc, lrcT)
      // console.log({
      //   lyric: decodeName(this.transformLrc(body.data.songinfo, lrc)),
      //   tlyric: decodeName(this.transformLrc(body.data.songinfo, lrcT)),
      // })
      return {
        lyric: decodeName(this.transformLrc(body.data.songinfo, lrc)),
        tlyric: lrcT.length ? decodeName(this.transformLrc(body.data.songinfo, lrcT)) : '',
      }
    })
    return requestObj
  },
}
