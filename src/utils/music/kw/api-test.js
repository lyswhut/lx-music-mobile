import { httpFetch } from '../../request'
import { requestMsg } from '../../message'
// import { headers, timeout } from '../options'
import { timeout } from '../options'

const api_test = {
  // getMusicUrl(songInfo, type) {
  //   const requestObj = httpFetch(`http://45.32.53.128:3002/m/kw/u/${songInfo.songmid}/${type}`, {
  //     method: 'get',
  //     headers,
  //     timeout,
  //   })
  //   requestObj.promise = requestObj.promise.then(({ body }) => {
  //     return body.code === 0 ? Promise.resolve({ type, url: body.data }) : Promise.reject(new Error(body.msg))
  //   })
  //   return requestObj
  // },
  // getMusicUrl(songInfo, type) {
  //   const requestObj = httpFetch(`http://ts.tempmusics.tk/url/kw/${songInfo.songmid}/${type}`, {
  //     method: 'get',
  //     timeout,
  //     headers,
  //     family: 4,
  //   })
  //   requestObj.promise = requestObj.promise.then(({ body }) => {
  //     return body.code === 0 ? Promise.resolve({ type, url: body.data }) : Promise.reject(new Error(requestMsg.fail))
  //   })
  //   return requestObj
  // },
  getMusicUrl(songInfo, type) {
    const requestObj = httpFetch(`http://antiserver.kuwo.cn/anti.s?format=mp3&rid=${songInfo.songmid}&response=url&type=convert_url3&br=${type}mp3`, {
      method: 'get',
      timeout,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:82.0) Gecko/20100101 Firefox/82.0' },
      family: 4,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 200 ? Promise.resolve({ type, url: body.url }) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
}

export default api_test
