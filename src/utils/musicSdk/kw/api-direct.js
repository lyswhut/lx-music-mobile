import { httpFetch } from '../../request'
import { timeout } from '../options'

export default {
  getMusicUrl(songInfo, type) {
    const target_url = `http://www.kuwo.cn/api/v1/www/music/playUrl?mid=${songInfo.songmid}&type=music&httpsStatus=1`
    const requestObj = httpFetch(target_url, {
      method: 'get',
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:82.0) Gecko/20100101 Firefox/82.0',
        Referer: 'http://kuwo.cn/',
      },
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      // console.log(body)
      if (body.code != 200) return Promise.reject(new Error('failed'))

      return { type, url: body.data.url }
    })
    return requestObj
  },
}
