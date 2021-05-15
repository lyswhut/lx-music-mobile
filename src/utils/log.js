import { requestStoragePermission } from '@/utils/common'
import { externalDirectoryPath, existsFile, writeFile, appendFile } from '@/utils/fs'

if (process.env.NODE_ENV !== 'development') {
  const logPath = externalDirectoryPath + '/debug.log'

  let tempLog = []

  const log = window.console.log
  const error = window.console.error
  const warn = window.console.warn

  const writeLog = msg => appendFile(logPath, '\n' + msg)

  window.console.log = (...msgs) => {
    log(...msgs)
    let msg = msgs.map(m => typeof m == 'object' ? JSON.stringify(m) : m).join(' ')
    if (msg.startsWith('%c')) return
    let time = new Date().toLocaleString()
    if (tempLog) {
      tempLog.push({ type: 'LOG', time, text: msg })
    } else writeLog(`${time} LOG ${msg}`)
  }
  window.console.error = (...msgs) => {
    error(...msgs)
    let msg = msgs.map(m => typeof m == 'object' ? JSON.stringify(m) : m).join(' ')
    let time = new Date().toLocaleString()
    if (tempLog) {
      tempLog.push({ type: 'ERROR', time, text: msg })
    } else writeLog(`${time} ERROR ${msg}`)
  }
  window.console.warn = (...msgs) => {
    warn(...msgs)
    let msg = msgs.map(m => typeof m == 'object' ? JSON.stringify(m) : m).join(' ')
    let time = new Date().toLocaleString()
    if (tempLog) {
      tempLog.push({ type: 'WARN', time, text: msg })
    } else writeLog(`${time} WARN ${msg}`)
  }

  const init = async() => {
    try {
      let result = await requestStoragePermission()
      if (!result) return
      let isExists = await existsFile(logPath)
      console.log(logPath, isExists)
      if (!isExists) await writeFile(logPath, '')
      writeLog(tempLog.map(m => `${m.time} ${m.type} ${m.text}`).join('\n'))
      tempLog = null
    } catch (err) {
      console.error(err)
    }
  }


  init()
}

