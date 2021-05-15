import { httpFetch } from '../../request'

export default {
  formatTime(time) {
    const m = parseInt(time / 60)
    const s = (time % 60).toFixed(2)
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
  },
  transformLrc({ songinfo, lrclist }) {
    return `[ti:${songinfo.songName}]\n[ar:${songinfo.artist}]\n[al:${songinfo.album}]\n[by:]\n[offset:0]\n${lrclist ? lrclist.map(l => `[${this.formatTime(l.time)}]${l.lineLyric}\n`).join('') : '暂无歌词'}`
  },
  getLyric(songId) {
    const requestObj = httpFetch(`http://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=${songId}`)
    requestObj.promise = requestObj.promise.then(({ body }) => {
      if (body.status != 200) return Promise.reject(new Error('请求失败'))
      return { lyric: this.transformLrc(body.data), tlyric: '', lxlyric: null }
    })
    return requestObj
  },
}
