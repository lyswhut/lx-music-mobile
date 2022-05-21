// const { simplified, traditional } = require('./chinese')
import stMap from './chinese'

// const stMap = {}
// const tsMap = new Map()

// simplified.split('').forEach((char, index) => {
//   stMap[char] = traditional[index]
//   // stMap.set(char, traditional[index])
//   // tsMap.set(traditional[index], char)
// })
// console.log(JSON.stringify(stMap))
// function simplify(source) {
//   let result = []
//   for (const char of source) {
//     result.push(tsMap.get(char) || char)
//   }
//   return result.join('')
// }

function tranditionalize(source) {
  let result = []
  for (const char of source) {
    result.push(stMap[char] || char)
  }
  return result.join('')
}

// module.exports = {
//   // simplify,
//   tranditionalize,
// }
export {
  tranditionalize,
}
