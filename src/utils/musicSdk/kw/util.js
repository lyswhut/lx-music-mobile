// import BackgroundTimer from 'react-native-background-timer'
// import { httpGet, httpFetch } from '../../request'
import { toMD5 } from '../utils'
import { aesEncryptSync, aesDecryptSync, AES_MODE } from '@/utils/nativeModules/crypto'
export { default as decodeLyric } from './decodeLyric'

// const kw_token = {
//   token: null,
//   isGetingToken: false,
// }

// const translationMap = {
//   "{'": '{"',
//   "'}\n": '"}',
//   "'}": '"}',
//   "':'": '":"',
//   "','": '","',
//   "':{'": '":{"',
//   "':['": '":["',
//   "'}],'": '"}],"',
//   "':[{'": '":[{"',
//   "'},'": '"},"',
//   "'},{'": '"},{"',
//   "':[],'": '":[],"',
//   "':{},'": '":{},"',
//   "'}]}": '"}]}',
// }

// export const objStr2JSON = str => {
//   return JSON.parse(str.replace(/(^{'|'}\n$|'}$|':'|','|':\[{'|'}\],'|':{'|'},'|'},{'|':\['|':\[\],'|':{},'|'}]})/g, s => translationMap[s]))
// }

export const objStr2JSON = str => {
  return JSON.parse(str.replace(/('(?=(,\s*')))|('(?=:))|((?<=([:,]\s*))')|((?<={)')|('(?=}))/g, '"'))
}


export const formatSinger = rawData => rawData.replace(/&/g, '、')

export const matchToken = headers => {
  try {
    return headers['set-cookie'].match(/kw_token=(\w+)/)[1]
  } catch (err) {
    return null
  }
}

// const wait = time => new Promise(resolve => setTimeout(() => resolve(), time))


// export const getToken = (retryNum = 0) => new Promise((resolve, reject) => {
//   if (retryNum > 2) return Promise.reject(new Error('try max num'))

//   if (kw_token.isGetingToken) return wait(1000).then(() => getToken(retryNum).then(token => resolve(token)))
//   if (kw_token.token) return resolve(kw_token.token)
//   kw_token.isGetingToken = true
//   httpGet('http://www.kuwo.cn/', (err, resp) => {
//     kw_token.isGetingToken = false
//     if (err) return getToken(++retryNum)
//     if (resp.statusCode != 200) return reject(new Error('获取失败'))
//     const token = kw_token.token = matchToken(resp.headers)
//     resolve(token)
//   })
// })

// export const tokenRequest = async(url, options = {}) => {
//   let token = kw_token.token
//   if (!token) token = await getToken()
//   if (!options.headers) {
//     options.headers = {
//       Referer: 'http://www.kuwo.cn/',
//       csrf: token,
//       cookie: 'kw_token=' + token,
//     }
//   }
//   const requestObj = httpFetch(url, options)
//   requestObj.promise = requestObj.promise.then(resp => {
//     // console.log(resp)
//     if (resp.statusCode == 200) {
//       kw_token.token = matchToken(resp.headers)
//     }
//     return resp
//   })
//   return requestObj
// }

export const lrcTools = {
  rxps: {
    wordLine: /^(\[\d{1,2}:.*\d{1,4}\])\s*(\S+(?:\s+\S+)*)?\s*/,
    tagLine: /\[(ver|ti|ar|al|offset|by|kuwo):\s*(\S+(?:\s+\S+)*)\s*\]/,
    wordTimeAll: /<(-?\d+),(-?\d+)(?:,-?\d+)?>/g,
    wordTime: /<(-?\d+),(-?\d+)(?:,-?\d+)?>/,
  },
  offset: 1,
  offset2: 1,
  isOK: false,
  lines: [],
  tags: [],
  getWordInfo(str, str2, prevWord) {
    const offset = parseInt(str)
    const offset2 = parseInt(str2)
    let startTime = Math.abs((offset + offset2) / (this.offset * 2))
    let endTime = Math.abs((offset - offset2) / (this.offset2 * 2)) + startTime
    if (prevWord) {
      if (startTime < prevWord.endTime) {
        prevWord.endTime = startTime
        if (prevWord.startTime > prevWord.endTime) {
          prevWord.startTime = prevWord.endTime
        }

        prevWord.newTimeStr = `<${prevWord.startTime},${prevWord.endTime - prevWord.startTime}>`
        // console.log(prevWord)
      }
    }
    return {
      startTime,
      endTime,
      timeStr: `<${startTime},${endTime - startTime}>`,
    }
  },
  parseLine(line) {
    if (line.length < 6) return
    let result = this.rxps.wordLine.exec(line)
    if (result) {
      const time = result[1]
      let words = result[2]
      if (words == null) {
        words = ''
      }
      const wordTimes = words.match(this.rxps.wordTimeAll)
      if (!wordTimes) return
      // console.log(wordTimes)
      let preTimeInfo
      for (const timeStr of wordTimes) {
        const result = this.rxps.wordTime.exec(timeStr)
        const wordInfo = this.getWordInfo(result[1], result[2], preTimeInfo)
        words = words.replace(timeStr, wordInfo.timeStr)
        if (preTimeInfo?.newTimeStr) words = words.replace(preTimeInfo.timeStr, preTimeInfo.newTimeStr)
        preTimeInfo = wordInfo
      }
      this.lines.push(time + words)
      return
    }
    result = this.rxps.tagLine.exec(line)
    if (!result) return
    if (result[1] == 'kuwo') {
      let content = result[2]
      if (content != null && content.includes('][')) {
        content = content.substring(0, content.indexOf(']['))
      }
      const valueOf = parseInt(content, 8)
      this.offset = Math.trunc(valueOf / 10)
      this.offset2 = Math.trunc(valueOf % 10)
      if (this.offset == 0 || Number.isNaN(this.offset) || this.offset2 == 0 || Number.isNaN(this.offset2)) {
        this.isOK = false
      }
    } else {
      this.tags.push(line)
    }
  },
  parse(lrc) {
    // console.log(lrc)
    const lines = lrc.split(/\r\n|\r|\n/)
    const tools = Object.create(this)
    tools.isOK = true
    tools.offset = 1
    tools.offset2 = 1
    tools.lines = []
    tools.tags = []

    for (const line of lines) {
      if (!tools.isOK) throw new Error('failed')
      tools.parseLine(line)
    }
    if (!tools.lines.length) return ''
    let lrcs = tools.lines.join('\n')
    if (tools.tags.length) lrcs = `${tools.tags.join('\n')}\n${lrcs}`
    // console.log(lrcs)
    return lrcs
  },
}


// const createAesEncrypt = (buffer, mode, key, iv) => {
//   const cipher = createCipheriv(mode, key, iv)
//   return Buffer.concat([cipher.update(buffer), cipher.final()])
// }

// const createAesDecrypt = (buffer, mode, key, iv) => {
//   const cipher = createDecipheriv(mode, key, iv)
//   return Buffer.concat([cipher.update(buffer), cipher.final()])
// }

export const wbdCrypto = {
  aesMode: 'aes-128-ecb',
  // aesKey: Buffer.from([112, 87, 39, 61, 199, 250, 41, 191, 57, 68, 45, 114, 221, 94, 140, 228], 'binary'),
  aesKey: 'cFcnPcf6Kb85RC1y3V6M5A==',
  aesIv: '',
  appId: 'y67sprxhhpws',
  decodeData(base64Result) {
    // const data = Buffer.from(decodeURIComponent(base64Result), 'base64')
    // return JSON.parse(createAesDecrypt(data, this.aesMode, this.aesKey, this.aesIv).toString())
    const data = decodeURIComponent(base64Result)
    return JSON.parse(aesDecryptSync(data, this.aesKey, this.aesIv, AES_MODE.ECB_128_NoPadding))
  },
  createSign(data, time) {
    const str = `${this.appId}${data}${time}`
    return toMD5(str).toUpperCase()
  },
  buildParam(jsonData) {
    // const data = Buffer.from(JSON.stringify(jsonData))
    // const time = Date.now()

    // const encodeData = createAesEncrypt(data, this.aesMode, this.aesKey, this.aesIv).toString('base64')
    const data = Buffer.from(JSON.stringify(jsonData)).toString('base64')
    const time = Date.now()

    const encodeData = aesEncryptSync(data, this.aesKey, this.aesIv, AES_MODE.ECB_128_NoPadding)
    const sign = this.createSign(encodeData, time)

    return `data=${encodeURIComponent(encodeData)}&time=${time}&appId=${this.appId}&sign=${sign}`
  },
}
