import { log as writeLog } from '@/utils/log'

export default {
  r_info(...args) {
    writeLog.info(...args)
  },
  r_warn(...args) {
    writeLog.warn(...args)
  },
  r_error(...args) {
    writeLog.error(...args)
  },
  info(...args) {
    if (global.isEnableSyncLog) writeLog.info(...args)
  },
  warn(...args) {
    if (global.isEnableSyncLog) writeLog.warn(...args)
  },
  error(...args) {
    if (global.isEnableSyncLog) writeLog.error(...args)
  },
}
