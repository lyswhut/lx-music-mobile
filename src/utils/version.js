import { httpGet } from '@/utils/request'
import { author, name } from '../../package.json'
import { downloadFile, stopDownload, temporaryDirectoryPath } from '@/utils/fs'
import { getSupportedAbis, installApk } from '@/utils/nativeModules/utils'
import { APP_PROVIDER_NAME } from '@/config/constant'

const abis = [
  'arm64-v8a',
  'armeabi-v7a',
  'x86_64',
  'x86',
  'universal',
]

export const getVersionInfo = (retryNum = 0) => {
  return new Promise((resolve, reject) => {
    httpGet(`https://raw.githubusercontent.com/${author.name}/${name}/master/publish/version.json`, {
      timeout: 15000,
    }, (err, resp, body) => {
      if (err || body.version == null) {
        // toast(err.message)
        return ++retryNum > 1
          ? getVersionInfo2().then(resolve).catch(reject)
          : getVersionInfo(retryNum).then(resolve).catch(reject)
      }
      resolve(body)
    })
  })
}

const getVersionInfo2 = (retryNum = 0) => {
  return new Promise((resolve, reject) => {
    httpGet('https://gitee.com/lyswhut/lx-music-mobile-versions/raw/master/version.json', {
      timeout: 20000,
    }, (err, resp, body) => {
      if (err || body.version == null) {
        return ++retryNum > 3
          ? getVersionInfo3().then(resolve).catch(reject)
          : getVersionInfo2(retryNum).then(resolve).catch(reject)
      }
      resolve(body)
    })
  })
}

const getVersionInfo3 = (retryNum = 0) => {
  return new Promise((resolve, reject) => {
    httpGet('https://cdn.stsky.cn/lx-music/mobile/version.json', {
      timeout: 20000,
    }, (err, resp, body) => {
      if (err || body.version == null) {
        return ++retryNum > 3
          ? resolve({ version: '0.0.0', desc: '', history: [] })
          : getVersionInfo3(retryNum).then(resolve).catch(reject)
      }
      resolve(body)
    })
  })
}

const getTargetAbi = async() => {
  const supportedAbis = await getSupportedAbis()
  for (const abi of abis) {
    if (supportedAbis.includes(abi)) return abi
  }
  return abis[abis.length - 1]
}
let downloadJobId = null
const noop = (total, download) => {}
let apkSavePath

export const downloadNewVersion = async(version, onDownload = noop) => {
  const abi = await getTargetAbi()
  const url = `https://github.com/${author.name}/${name}/releases/download/v${version}/${name}-v${version}-${abi}.apk`
  let savePath = temporaryDirectoryPath + '/lx-music-mobile.apk'

  if (downloadJobId) stopDownload(downloadJobId)

  const { jobId, promise } = downloadFile(url, savePath, {
    progressInterval: 500,
    connectionTimeout: 20000,
    readTimeout: 30000,
    begin({ statusCode, contentLength }) {
      onDownload(contentLength, 0)
      // switch (statusCode) {
      //   case 200:
      //   case 206:
      //     break
      //   default:
      //     onDownload(null, contentLength, 0)
      //     break
      // }
    },
    progress({ contentLength, bytesWritten }) {
      onDownload(contentLength, bytesWritten)
    },
  })
  downloadJobId = jobId
  return promise.then(() => {
    apkSavePath = savePath
    return updateApp()
  })
}

export const updateApp = async() => {
  if (!apkSavePath) throw new Error('apk Save Path is null')
  await installApk(apkSavePath, APP_PROVIDER_NAME)
}
