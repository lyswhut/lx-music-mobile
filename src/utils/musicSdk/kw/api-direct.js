import { httpFetch } from '../../request'
import { timeout } from '../options'

export default {
  getMusicUrl(songInfo, type) {
    const target_url = `http://www.kuwo.cn/api/v1/www/music/playUrl?mid=${songInfo.songmid}&type=music&br=${type}`
    const requestObj = httpFetch(target_url, {
      method: 'get',
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:82.0) Gecko/20100101 Firefox/82.0',
        Referer: 'http://kuwo.cn/',
        Secret: '14da58a88a83170f11c3a63bb0ff6aec68a7487b64551a1f997356d719980a2b028f34f5',
        cookie: 'Hm_Iuvt_cdb524f42f0cer9b268e4v7y734w5esq24=4cGcsx3ej3tkYfeGrFtdS2kSZ6YD3nbD',
      },
      credentials: 'omit',
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      // console.log(JSON.stringify(body))
      if (body.code != 200) return Promise.reject(new Error('failed'))

      return { type, url: body.data.url }
    })
    return requestObj
  },
}
