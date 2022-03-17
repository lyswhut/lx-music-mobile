import { httpFetch } from '../../request'
import { timeout } from '../options'

const qualitys = {
  '128k': 'PQ',
  '320k': 'HQ',
  flac: 'SQ',
  flac32bit: 'ZQ',
}

const api_test = {
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

export default api_test
