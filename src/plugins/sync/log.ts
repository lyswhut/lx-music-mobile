import { log as writeLog } from '@/utils/log'

export default {
  r_info(...params: any[]) {
    writeLog.info(...params)
  },
  r_warn(...params: any[]) {
    writeLog.warn(...params)
  },
  r_error(...params: any[]) {
    writeLog.error(...params)
  },
  info(...params: any[]) {
    if (global.lx.isEnableSyncLog) writeLog.info(...params)
  },
  warn(...params: any[]) {
    if (global.lx.isEnableSyncLog) writeLog.warn(...params)
  },
  error(...params: any[]) {
    if (global.lx.isEnableSyncLog) writeLog.error(...params)
  },
}
