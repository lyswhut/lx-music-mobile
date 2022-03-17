import { httpFetch } from '../../request'
import { timeout } from '../options'
import { eapi } from './utils/crypto'

// https://github.com/listen1/listen1_chrome_extension/blob/master/js/provider/netease.js

const qualitys = {
  '128k': 128000,
  '320k': 320000,
  flac: 999000,
}

let cookie = 'os=pc'

export default {
  getMusicUrl(songInfo, type) {
    const quality = qualitys[type]
    const target_url = 'https://interface3.music.163.com/eapi/song/enhance/player/url'
    const eapiUrl = '/api/song/enhance/player/url'

    const d = {
      ids: `[${songInfo.songmid}]`,
      br: quality,
    }
    const data = eapi(eapiUrl, d)

    const requestObj = httpFetch(target_url, {
      method: 'POST',
      timeout,
      form: data,
      headers: {
        cookie,
      },
    })
    requestObj.promise = requestObj.promise.then(({ headers, body }) => {
      // console.log(body)

      if (headers.cookie) cookie = headers.cookie

      const { url } = body.data[0]
      if (!url) return Promise.reject(new Error('failed'))
      return { type, url }
    })
    return requestObj
  },
}
