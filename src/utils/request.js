// import needle from 'needle'
// import progress from 'request-progress'
import BackgroundTimer from 'react-native-background-timer'
import { requestMsg } from './message'
import { bHh } from './musicSdk/options'
import { deflateRaw } from 'pako'

const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
}
// var proxyUrl = "http://" + user + ":" + password + "@" + host + ":" + port;
// var proxiedRequest = request.defaults({'proxy': proxyUrl});


/**
 * 请求超时自动重试
 * @param {*} url
 * @param {*} options
 */
export const httpFetch = (url, options = { method: 'get' }) => {
  const requestObj = fetchData(url, options)
  return {
    promise: requestObj.request.catch(err => {
      console.log('出错', err.message)
      switch (err.message) {
        case 'socket hang up':
          return Promise.reject(new Error(requestMsg.unachievable))
        case 'Aborted':
          return Promise.reject(new Error(requestMsg.timeout))
        case 'Network request failed':
          return Promise.reject(new Error(requestMsg.notConnectNetwork))
        default:
          return Promise.reject(err)
      }
    }),
    cancelHttp() {
      requestObj.abort()
    },
  }
}

/**
 * http get 请求
 * @param {*} url 地址
 * @param {*} options 选项
 * @param {*} callback 回调
 * @return {Number} index 用于取消请求
 */
export const httpGet = (url, options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  const requestObj = fetchData(url, { ...options, method: 'get' })
  requestObj.request.then(resp => {
    callback(null, resp, resp.body)
  }).catch(err => {
    // debugRequest && console.log(JSON.stringify(err))
    callback(err, null, null)
  })

  return () => {
    requestObj.abort()
  }
}

/*
const fetchWithTimeout = (resource, options) => {
  const { timeout = 8000 } = options

  const controller = new global.AbortController()
  const id = BackgroundTimer.setTimeout(() => controller.abort(), timeout)

  return {
    request: global.fetch(resource, {
      ...options,
      signal: controller.signal,
    }).then(response => {
      BackgroundTimer.clearTimeout(id)
      return response
    }),
    abort() {
      controller.abort()
    },
  }
} */


const handleDeflateRaw = data => new Promise((resolve, reject) => {
  resolve(Buffer.from(deflateRaw(data)))
  // deflateRaw(data, (err, buf) => {
  //   if (err) return reject(err)
  //   resolve(buf)
  // })
})

const regx = /(?:\d\w)+/g

const handleRequestData = async(url, {
  method = 'get',
  headers = {},
  format = 'json',
  cache = 'no-store',
  ...options
}) => {
  // console.log(url, options)
  headers = Object.assign({
    Accept: 'application/json',
  }, headers)
  options.cache = cache
  if (method.toLocaleLowerCase() === 'post' && !headers['Content-Type']) {
    if (options.form) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
      const formBody = []
      for (let [key, value] of Object.entries(options.form)) {
        let encodedKey = encodeURIComponent(key)
        let encodedValue = encodeURIComponent(value)
        formBody.push(`${encodedKey}=${encodedValue}`)
      }
      options.body = formBody.join('&')
      delete options.form
    } else if (options.formData) {
      headers['Content-Type'] = 'multipart/form-data'
      const formBody = []
      for (let [key, value] of Object.entries(options.form)) {
        let encodedKey = encodeURIComponent(key)
        let encodedValue = encodeURIComponent(value)
        formBody.push(`${encodedKey}=${encodedValue}`)
      }
      options.body = options.formData
      delete options.formData
    } else {
      headers['Content-Type'] = 'application/json'
    }
  }
  if (headers['Content-Type'] === 'application/json' && options.body) {
    options.body = JSON.stringify(options.body)
  }
  if (headers[bHh]) {
    let s = Buffer.from(bHh, 'hex').toString()
    s = s.replace(s.substr(-1), '')
    s = Buffer.from(s, 'base64').toString()
    const v = process.versions.app.split('-')[0].split('.').map(n => n.length < 3 ? n.padStart(3, '0') : n).join('')
    const v2 = process.versions.app.split('-')[1] || ''
    headers[s] = !s || `${(await handleDeflateRaw(Buffer.from(JSON.stringify(`${url}${v}`.match(regx), null, 1).concat(v)).toString('base64'))).toString('hex')}&${parseInt(v)}${v2}`
    delete headers[bHh]
  }

  return {
    ...options,
    method,
    headers: Object.assign({}, defaultHeaders, headers),
  }
}

// https://stackoverflow.com/a/64945178
const blobToBuffer = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new global.FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const data = reader.result.slice(reader.result.indexOf('base64,') + 7)
      resolve(Buffer.from(data, 'base64'))
    }
    reader.readAsDataURL(blob)
  })
}

const fetchData = (url, { timeout = 15000, ...options }) => {
  console.log('---start---', url)

  const controller = new global.AbortController()
  let id = BackgroundTimer.setTimeout(() => {
    id = null
    controller.abort()
  }, timeout)

  return {
    request: handleRequestData(url, options).then(options => {
      return global.fetch(url, {
        ...options,
        signal: controller.signal,
      }).then(resp => (options.binary ? resp.blob() : resp.text()).then(text => {
        // console.log(options, headers, text)
        return {
          headers: resp.headers.map,
          body: text,
          statusCode: resp.status,
          url: resp.url,
          ok: resp.ok,
        }
      })).then(resp => {
        if (options.binary) {
          return blobToBuffer(resp.body).then(buffer => {
            resp.body = buffer
            return resp
          })
        } else {
          try {
            resp.body = JSON.parse(resp.body)
          } catch {}
          return resp
        }
      }).catch(err => {
        // console.log(err, err.code, err.message)
        return Promise.reject(err)
      }).finally(() => {
        if (id == null) return
        BackgroundTimer.clearTimeout(id)
      })
    }),
    abort() {
      controller.abort()
    },
  }
}
