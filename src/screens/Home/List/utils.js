import { debounce } from '@/utils'


// https://blog.csdn.net/xcxy2015/article/details/77164126#comments
const similar = (a, b) => {
  if (!a || !b) return 0
  if (a.length > b.length) { // 保证 a <= b
    let t = b
    b = a
    a = t
  }
  let al = a.length
  let bl = b.length
  let mp = [] // 一个表
  let i, j, ai, lt, tmp // ai：字符串a的第i个字符。 lt：左上角的值。 tmp：暂存新的值。
  for (i = 0; i <= bl; i++) mp[i] = i
  for (i = 1; i <= al; i++) {
    ai = a.charAt(i - 1)
    lt = mp[0]
    mp[0] = mp[0] + 1
    for (j = 1; j <= bl; j++) {
      tmp = Math.min(mp[j] + 1, mp[j - 1] + 1, lt + (ai == b.charAt(j - 1) ? 0 : 1))
      lt = mp[j]
      mp[j] = tmp
    }
  }
  return 1 - (mp[bl] / bl)
}

const sortInsert = (arr, data) => {
  let key = data.num
  let left = 0
  let right = arr.length - 1

  while (left <= right) {
    let middle = parseInt((left + right) / 2)
    if (key == arr[middle]) {
      left = middle
      break
    } else if (key < arr[middle].num) {
      right = middle - 1
    } else {
      left = middle + 1
    }
  }
  while (left > 0) {
    if (arr[left - 1].num != key) break
    left--
  }

  arr.splice(left, 0, data)
}

const handleSortList = (list, keyword) => {
  let arr = []
  for (const item of list) {
    sortInsert(arr, {
      num: similar(keyword, `${item.name} ${item.singer} ${item.albumName || ''}`),
      data: item,
    })
  }
  return arr.map(item => item.data).reverse()
}

export const debounceSearchList = debounce((text, list, callback) => {
  const reslutList = []
  if (!text.length) return
  let rxp = new RegExp(text.split('').map(s => s.replace(/[.*+?^${}()|[\]\\]/, '\\$&')).join('.*') + '.*', 'i')
  for (const item of list) {
    if (rxp.test(`${item.name}${item.singer}${item.albumName ? item.albumName : ''}`)) reslutList.push(item)
  }
  // console.log(reslutList)
  callback(handleSortList(reslutList, text))
}, 200)
