import { httpFetch } from '../../request'
import { timeout } from '../options'

// https://github.com/listen1/listen1_chrome_extension/blob/master/js/provider/kugou.js
export default {
  getMusicUrl(songInfo, type) {
    const target_url = `https://wwwapi.kugou.com/yy/index.php?r=play/getdata&hash=${songInfo.hash}&platid=4&album_id=${songInfo.albumId}&mid=00000000000000000000000000000000`
    const requestObj = httpFetch(target_url, {
      method: 'get',
      timeout,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      // console.log(body)

      if (body.status !== 1) return Promise.reject(new Error(body.err_code))
      if (body.data.is_free_part || !body.data.play_backup_url) return Promise.reject(new Error('failed'))

      return Promise.resolve({ type, url: body.data.play_backup_url })
    })
    return requestObj
  },
}
