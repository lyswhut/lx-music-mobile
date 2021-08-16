

/**
 * 获取两个数之间的随机整数，大于等于min，小于max
 * @param {*} min
 * @param {*} max
 */
export const getRandom = (min, max) => Math.floor(Math.random() * (max - min)) + min


export const sizeFormate = size => {
  // https://gist.github.com/thomseddon/3511330
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const number = Math.floor(Math.log(size) / Math.log(1024))
  return `${(size / Math.pow(1024, Math.floor(number))).toFixed(2)} ${units[number]}`
}

export const formatPlayTime = time => {
  const m = parseInt(time / 60)
  const s = parseInt(time % 60)
  return m === 0 && s === 0 ? '--/--' : (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
}

export const formatPlayTime2 = time => {
  const m = parseInt(time / 60)
  const s = parseInt(time % 60)
  return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
}

export const b64DecodeUnicode = str => {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return Buffer.from(str, 'base64').toString()
}

const encodeNames = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#039;': "'",
}
export const decodeName = (str = '') => str.replace(/(?:&amp;|&lt;|&gt;|&quot;|&apos;|&#039;)/gm, s => encodeNames[s])

// https://stackoverflow.com/a/53387532
export const compareVer = (currentVer, targetVer) => {
  // treat non-numerical characters as lower version
  // replacing them with a negative number based on charcode of each character
  const fix = s => `.${s.toLowerCase().charCodeAt(0) - 2147483647}.`

  currentVer = ('' + currentVer).replace(/[^0-9.]/g, fix).split('.')
  targetVer = ('' + targetVer).replace(/[^0-9.]/g, fix).split('.')
  const c = Math.max(currentVer.length, targetVer.length)
  for (let i = 0; i < c; i++) {
    // convert to integer the most efficient way
    currentVer[i] = ~~currentVer[i]
    targetVer[i] = ~~targetVer[i]
    if (currentVer[i] > targetVer[i]) return 1
    else if (currentVer[i] < targetVer[i]) return -1
  }
  return 0
}

export const isObject = item => item && typeof item === 'object' && !Array.isArray(item)

/**
 * 对象深度合并
 * @param  {} target 要合并源对象
 * @param  {} source 要合并目标对象
 */
export const objectDeepMerge = (target, source, mergedObj) => {
  if (!mergedObj) {
    mergedObj = new Set()
    mergedObj.add(target)
  }
  const base = {}
  Object.keys(source).forEach(item => {
    if (isObject(source[item])) {
      if (mergedObj.has(source[item])) return
      if (!isObject(target[item])) target[item] = {}
      mergedObj.add(source[item])
      objectDeepMerge(target[item], source[item], mergedObj)
      return
    }
    base[item] = source[item]
  })
  Object.assign(target, base)
}

/**
 * 生成节流函数
 * @param {*} fn
 * @param {*} delay
 */
export const throttle = (fn, delay = 100) => {
  let timer = null
  let _args = null
  return function(...args) {
    _args = args
    if (timer) return
    timer = setTimeout(() => {
      timer = null
      fn.apply(this, _args)
    }, delay)
  }
}

/**
 * 生成防抖函数
 * @param {*} fn
 * @param {*} delay
 */
export const debounce = (fn, delay = 100) => {
  let timer = null
  let _args = null
  return function(...args) {
    _args = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn.apply(this, _args)
    }, delay)
  }
}
