// import { requestStoragePermission } from '@/utils/common'
import { temporaryDirectoryPath, existsFile, writeFile, appendFile, mkdir, readFile, unlink } from '@/utils/fs'

export const LOG_TYPE = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
}
const logDir = temporaryDirectoryPath + '/lx_logs'
const logPath = {
  info: logDir + '/info.log',
  warn: logDir + '/warn.log',
  error: logDir + '/error.log',
}
const logTools = {
  tempLog: {
    info: [],
    warn: [],
    error: [],
  },
  writeLog(type, msg) {
    switch (type) {
      case LOG_TYPE.info:
        appendFile(logPath.info, '\n' + msg)
        break
      case LOG_TYPE.warn:
        appendFile(logPath.warn, '\n' + msg)
        break
      case LOG_TYPE.error:
        appendFile(logPath.error, '\n' + msg)
        break
      default:
        break
    }
  },
  async initLogFile(type, filePath) {
    try {
      let isExists = await existsFile(filePath)
      if (!isExists) await writeFile(filePath, '')
      if (this.tempLog[type].length) this.writeLog(LOG_TYPE[type], this.tempLog[type].map(m => `${m.time} ${m.type} ${m.text}`).join('\n'))
      this.tempLog[type] = null
    } catch (err) {
      console.error(err)
    }
  },
}

export const init = () => {
  return mkdir(logDir).then(() => {
    const tasks = []
    for (const [type, path] of Object.entries(logPath)) {
      tasks.push(logTools.initLogFile(type, path))
    }
    console.log('init log tools')
    return Promise.all(tasks)
  })
}

export const getLogs = (type = LOG_TYPE.error) => {
  let path
  switch (type) {
    case LOG_TYPE.info:
      path = logPath.info
      break
    case LOG_TYPE.warn:
      path = logPath.warn
      break
    case LOG_TYPE.error:
      path = logPath.error
      break
    default:
      return Promise.reject(new Error('Unknow log type'))
  }
  return readFile(path)
}

export const clearLogs = (type = LOG_TYPE.error) => {
  let path
  switch (type) {
    case LOG_TYPE.info:
      path = logPath.info
      break
    case LOG_TYPE.warn:
      path = logPath.warn
      break
    case LOG_TYPE.error:
      path = logPath.error
      break
    default:
      return Promise.reject(new Error('Unknow log type'))
  }
  return unlink(path).then(() => writeFile(path, ''))
}

export const log = {
  info(...msgs) {
    console.info(...msgs)
    let msg = msgs.map(m => typeof m == 'object' ? JSON.stringify(m) : m).join(' ')
    if (msg.startsWith('%c')) return
    let time = new Date().toLocaleString()
    if (logTools.tempLog.info) {
      logTools.tempLog.info.push({ type: 'LOG', time, text: msg })
    } else logTools.writeLog(LOG_TYPE.info, `${time} LOG ${msg}`)
  },
  warn(...msgs) {
    console.warn(...msgs)
    let msg = msgs.map(m => typeof m == 'object' ? JSON.stringify(m) : m).join(' ')
    let time = new Date().toLocaleString()
    if (logTools.tempLog.warn) {
      logTools.tempLog.warn.push({ type: 'WARN', time, text: msg })
    } else logTools.writeLog(LOG_TYPE.warn, `${time} WARN ${msg}`)
  },
  error(...msgs) {
    console.error(...msgs)
    let msg = msgs.map(m => typeof m == 'object' ? JSON.stringify(m) : m).join(' ')
    let time = new Date().toLocaleString()
    if (logTools.tempLog.error) {
      logTools.tempLog.error.push({ type: 'ERROR', time, text: msg })
    } else logTools.writeLog(LOG_TYPE.error, `${time} ERROR ${msg}`)
  },
}
/*
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

 */
