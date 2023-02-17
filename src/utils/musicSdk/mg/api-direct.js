import { httpFetch } from '../../request'
import { timeout } from '../options'

// https://github.com/listen1/listen1_chrome_extension/blob/master/js/provider/migu.js

const qualitys = {
  '128k': 'PQ',
  '320k': 'HQ',
  flac: 'SQ',
  flac32bit: 'ZQ',
}

export default {
  getMusicUrl(songInfo, type) {
    const quality = qualitys[type]
    const target_url = `https://app.c.nf.migu.cn/MIGUM2.0/strategy/listen-url/v2.2?netType=01&resourceType=E&songId=${songInfo.songmid}&toneFlag=${quality}`
    const requestObj = httpFetch(target_url, {
      method: 'get',
      timeout,
      headers: {
        channel: '0146951',
        uid: 1234,
      },
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      // console.log(body)

      let playUrl = body.data?.url
      if (!playUrl) return Promise.reject(new Error('failed'))

      if (playUrl.startsWith('//')) playUrl = `https:${playUrl}`

      return { type, url: playUrl.replace(/\+/g, '%2B') }
    })
    return requestObj
  },
}
