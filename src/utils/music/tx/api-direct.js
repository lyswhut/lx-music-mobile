import { httpFetch } from '../../request'
import { timeout } from '../options'

// https://github.com/listen1/listen1_chrome_extension/blob/master/js/provider/qq.js

const fileConfig = {
  '128k': {
    s: 'M500',
    e: '.mp3',
    bitrate: '128kbps',
  },
  '320k': {
    s: 'M800',
    e: '.mp3',
    bitrate: '320kbps',
  },
  flac: {
    s: 'F000',
    e: '.flac',
    bitrate: 'FLAC',
  },
}

export default {
  getMusicUrl(songInfo, type) {
    const target_url = 'https://u.y.qq.com/cgi-bin/musicu.fcg'
    // thanks to https://github.com/Rain120/qq-music-api/blob/2b9cb811934888a532545fbd0bf4e4ab2aea5dbe/routers/context/getMusicPlay.js
    const guid = '10000'
    const songmidList = [songInfo.songmid]
    const uin = '0'

    const fileInfo = fileConfig[type]
    const file =
      songmidList.length === 1 &&
      `${fileInfo.s}${songInfo.songmid}${songInfo.songmid}${fileInfo.e}`

    const reqData = {
      req_0: {
        module: 'vkey.GetVkeyServer',
        method: 'CgiGetVkey',
        param: {
          filename: file ? [file] : [],
          guid,
          songmid: songmidList,
          songtype: [0],
          uin,
          loginflag: 1,
          platform: '20',
        },
      },
      loginUin: uin,
      comm: {
        uin,
        format: 'json',
        ct: 24,
        cv: 0,
      },
    }
    const requestObj = httpFetch(`${target_url}?format=json&data=${JSON.stringify(reqData)}`, {
      method: 'get',
      timeout,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      // console.log(body)

      const { purl } = body.req_0.data.midurlinfo[0]

      // vip
      if (purl === '') return Promise.reject(new Error('failed'))

      const url = body.req_0.data.sip[0] + purl

      return { type, url }
    })
    return requestObj
  },
}
